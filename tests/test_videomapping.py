import unittest
import numpy as np
import os
import json

from videomapping.core.project import Project
from videomapping.core.undo_redo import UndoRedoStack
from videomapping.calibration.mesh_warping import MeshWarpLayer
from videomapping.calibration.edge_blending import EdgeBlendingControl
from videomapping.calibration.masking import VectorMask
from videomapping.calibration.calibration_3d import ProjectionCalibrator3D
from videomapping.color.color_corrector import ColorCorrector
from videomapping.color.surface_compensation import SurfaceCompensation
from videomapping.color.black_level import BlackLevelOffset
from videomapping.control.timeline import TimelineController, TimelineClip, Cue
from videomapping.control.generative import GenerativeEngine

class TestVideoMappingCore(unittest.TestCase):
    def test_project_persistence(self):
        proj = Project()
        proj.name = "Unit Test Mapping Project"
        proj.meshes = [{"name": "layer1", "resolution": "8x8"}]
        proj.controls["osc_port_in"] = 9999

        # Test serialization
        temp_file = "test_project.json"
        proj.save_to_json(temp_file)
        self.assertTrue(os.path.exists(temp_file))

        # Test load
        proj_loaded = Project()
        proj_loaded.load_from_json(temp_file)
        self.assertEqual(proj_loaded.name, "Unit Test Mapping Project")
        self.assertEqual(proj_loaded.meshes[0]["name"], "layer1")
        self.assertEqual(proj_loaded.controls["osc_port_in"], 9999)

        # Cleanup
        os.remove(temp_file)

    def test_undo_redo(self):
        stack = UndoRedoStack(max_depth=5)
        state_1 = {"config": 1}
        state_2 = {"config": 2}

        stack.push_state(state_1)
        self.assertTrue(stack.can_undo())
        self.assertFalse(stack.can_redo())

        prev = stack.undo(state_2)
        self.assertEqual(prev["config"], 1)
        self.assertTrue(stack.can_redo())

        nxt = stack.redo(state_1)
        self.assertEqual(nxt["config"], 2)


class TestVideoMappingCalibration(unittest.TestCase):
    def test_mesh_warping(self):
        warp = MeshWarpLayer(cols=4, rows=4)
        # Test corner points unchanged
        p00 = warp.evaluate_bilinear(0.0, 0.0)
        self.assertAlmostEqual(p00[0], 0.0)
        self.assertAlmostEqual(p00[1], 0.0)

        p11 = warp.evaluate_bilinear(1.0, 1.0)
        self.assertAlmostEqual(p11[0], 1.0)
        self.assertAlmostEqual(p11[1], 1.0)

        # Change node coordinate and test warp deviation
        warp.update_node(1, 1, 0.35, 0.35)
        p_offset = warp.evaluate_bilinear(0.25, 0.25)
        self.assertNotEqual(p_offset, [0.25, 0.25])

    def test_edge_blending(self):
        blend = EdgeBlendingControl()
        blend.blend_left = 0.2
        # Normal factor inside target region should be 1.0
        factor_mid = blend.get_blend_factor(0.5, 0.5)
        self.assertEqual(factor_mid, 1.0)

        # Blended zone factor should be compressed
        factor_blend = blend.get_blend_factor(0.1, 0.5)
        self.assertLess(factor_blend, 1.0)

    def test_vector_masking(self):
        mask = VectorMask()
        # Create a simple triangle polygon
        mask.add_point(0.1, 0.1)
        mask.add_point(0.9, 0.1)
        mask.add_point(0.5, 0.9)

        self.assertTrue(mask.evaluate_point_inside(0.5, 0.5))
        self.assertFalse(mask.evaluate_point_inside(0.0, 0.0))

    def test_3d_calibration_dlt(self):
        calibrator = ProjectionCalibrator3D()
        # Construct synthetic correspondences for cube
        pts_3d = [
            [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
            [-1, -1, 1],  [1, -1, 1],  [1, 1, 1],  [-1, 1, 1]
        ]
        # Projected points using simulated focal parameters
        pts_2d = [
            [0.1, 0.1], [0.9, 0.1], [0.9, 0.9], [0.1, 0.9],
            [0.2, 0.2], [0.8, 0.2], [0.8, 0.8], [0.2, 0.8]
        ]
        for p3, p2 in zip(pts_3d, pts_2d):
            calibrator.add_correspondence(p3, p2)

        proj_matrix = calibrator.compute_dlt()
        self.assertIsNotNone(proj_matrix)
        self.assertEqual(proj_matrix.shape, (3, 4))


class TestVideoMappingColorAdjustment(unittest.TestCase):
    def test_color_adjustments(self):
        corrector = ColorCorrector()
        frame = np.ones((10, 10, 3), dtype=np.uint8) * 128

        # Test brightness scale multiplier
        corrector.brightness = 1.5
        adj_frame = corrector.process_adjustments(frame)
        self.assertGreater(adj_frame[0, 0, 0], 128)

    def test_surface_compensation(self):
        comp = SurfaceCompensation()
        frame = np.ones((10, 10, 3), dtype=np.uint8) * 128

        # Neutral gray wall should multiply inverse channels
        comp.set_surface_hex("#7f7f7f")
        res = comp.compensate_frame(frame)
        self.assertEqual(res[0, 0, 0], 128) # Maximum normalized matches bounds

    def test_black_level_offset(self):
        bl = BlackLevelOffset()
        frame = np.zeros((10, 10, 3), dtype=np.uint8)

        # Black offset should lift absolute floor value above 0
        bl.black_offset_r = 0.1
        res = bl.apply_offset(frame)
        self.assertGreater(res[0, 0, 0], 0)


class TestVideoMappingControl(unittest.TestCase):
    def test_timeline_playback(self):
        ctrl = TimelineController()
        clip = TimelineClip(clip_id=1, file_path="test.mp4", start_ms=1000, duration_ms=2000)
        ctrl.add_clip(clip)

        # Outside boundaries
        ctrl.playhead_ms = 500
        self.assertEqual(len(ctrl.get_active_clips()), 0)

        # Inside play range
        ctrl.playhead_ms = 2000
        self.assertEqual(len(ctrl.get_active_clips()), 1)
        self.assertEqual(clip.calculate_clip_time(2000), 1000)

    def test_generative_engine(self):
        engine = GenerativeEngine(width=100, height=100)
        # Verify radial visual spiral frame creation
        frame = engine.get_generative_frame("spiral", time_sec=1.0)
        self.assertEqual(frame.shape, (100, 100, 3))


if __name__ == "__main__":
    unittest.main()
