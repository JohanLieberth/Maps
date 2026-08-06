import sys
import time
from PyQt6.QtWidgets import (
    QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QPushButton,
    QLabel, QSlider, QComboBox, QCheckBox, QGroupBox, QSpinBox,
    QTabWidget, QFileDialog, QFormLayout, QSplitter
)
from PyQt6.QtCore import Qt, QTimer
from PyQt6.QtGui import QIcon, QFont

from videomapping.gui.widgets.gl_view import GLViewWidget
from videomapping.calibration.mesh_warping import MeshWarpLayer
from videomapping.calibration.edge_blending import EdgeBlendingControl
from videomapping.color.color_corrector import ColorCorrector
from videomapping.color.surface_compensation import SurfaceCompensation
from videomapping.color.black_level import BlackLevelOffset
from videomapping.control.timeline import TimelineController
from videomapping.control.generative import GenerativeEngine

class MainWindow(QMainWindow):
    """
    Main Desktop Workspace Controller. Features full layout dockability, Dark Mode CSS theme styling,
    and granular configuration sliders for full, professional video mapping control.
    """
    def __init__(self):
        super().__init__()
        self.setWindowTitle("ApexMapper - Professional Projection Mapping Suite")
        self.resize(1280, 800)

        # Core mathematical logic instances
        self.mesh_layer = MeshWarpLayer(cols=4, rows=4)
        self.edge_blender = EdgeBlendingControl()
        self.color_corrector = ColorCorrector()
        self.surface_compensator = SurfaceCompensation()
        self.black_offset = BlackLevelOffset()
        self.timeline = TimelineController()
        self.generative = GenerativeEngine()

        # Active system parameters
        self.fps_counter = 0
        self.last_fps_time = time.time()
        self.current_fps = 60.0

        # Build layout elements
        self._init_ui()
        self._apply_dark_theme()

        # Real-time frame rendering clock (target 60 FPS)
        self.render_timer = QTimer(self)
        self.render_timer.timeout.connect(self._on_render_tick)
        self.render_timer.start(16) # ~60 FPS

    def _init_ui(self):
        # Master splitter separating Left control panel and Right rendering view
        main_splitter = QSplitter(Qt.Orientation.Horizontal, self)

        # Left Panel (Scrollable Control Notebook tabs)
        left_tabs = QTabWidget()
        left_tabs.setMinimumWidth(450)

        # Tab 1: Calibration (Mesh, Masking, & 3D DLT)
        cal_widget = QWidget()
        cal_layout = QVBoxLayout(cal_widget)

        mesh_grp = QGroupBox("Mesh Warping (Deformación de Malla)")
        mesh_form = QFormLayout(mesh_grp)

        self.mesh_res_combo = QComboBox()
        self.mesh_res_combo.addItems(["4 x 4 (Normal)", "8 x 8 (Fine)", "16 x 16 (Ultra)"])
        self.mesh_res_combo.currentIndexChanged.connect(self._on_mesh_res_changed)
        mesh_form.addRow("Grid Resolution:", self.mesh_res_combo)

        self.chk_show_mesh = QCheckBox("Show Mesh Control Handles")
        self.chk_show_mesh.setChecked(True)
        self.chk_show_mesh.toggled.connect(self._on_toggle_mesh_handles)
        mesh_form.addRow(self.chk_show_mesh)

        btn_reset_mesh = QPushButton("Reset Mesh Grid")
        btn_reset_mesh.clicked.connect(self._on_reset_mesh)
        mesh_form.addRow(btn_reset_mesh)

        cal_layout.addWidget(mesh_grp)

        # 3D Projector calibration
        cal3d_grp = QGroupBox("3D Projection Calibration (DLT)")
        cal3d_layout = QVBoxLayout(cal3d_grp)

        lbl_info = QLabel("Interactive Cube projection targeting 3D space surface markers.")
        lbl_info.setWordWrap(True)
        cal3d_layout.addWidget(lbl_info)

        lbl_rot = QLabel("Cube Y-Rotation (Mapeo 3D):")
        cal3d_layout.addWidget(lbl_rot)
        self.sl_cube_rot = QSlider(Qt.Orientation.Horizontal)
        self.sl_cube_rot.setRange(0, 360)
        self.sl_cube_rot.setValue(45)
        self.sl_cube_rot.valueChanged.connect(self._on_cube_rot_changed)
        cal3d_layout.addWidget(self.sl_cube_rot)

        cal_layout.addWidget(cal3d_grp)

        # Edge Blending Group
        blend_grp = QGroupBox("Edge Blending (Fusión de Bordes)")
        blend_form = QFormLayout(blend_grp)

        self.sl_blend_left = QSlider(Qt.Orientation.Horizontal)
        self.sl_blend_left.setRange(0, 50) # 0 to 50% width
        self.sl_blend_left.valueChanged.connect(self._on_blend_changed)
        blend_form.addRow("Blend Width Left (%):", self.sl_blend_left)

        self.sl_blend_right = QSlider(Qt.Orientation.Horizontal)
        self.sl_blend_right.setRange(0, 50)
        self.sl_blend_right.valueChanged.connect(self._on_blend_changed)
        blend_form.addRow("Blend Width Right (%):", self.sl_blend_right)

        self.sl_blend_gamma = QSlider(Qt.Orientation.Horizontal)
        self.sl_blend_gamma.setRange(10, 30) # 1.0 to 3.0 gamma
        self.sl_blend_gamma.setValue(22) # default 2.2
        self.sl_blend_gamma.valueChanged.connect(self._on_blend_changed)
        blend_form.addRow("Blending Gamma Curve:", self.sl_blend_gamma)

        cal_layout.addWidget(blend_grp)
        cal_layout.addStretch()
        left_tabs.addTab(cal_widget, "Calibración")

        # Tab 2: Live Content (Generative & Playback tracks)
        live_widget = QWidget()
        live_layout = QVBoxLayout(live_widget)

        gen_grp = QGroupBox("Contenido Generativo (Real-Time)")
        gen_layout = QVBoxLayout(gen_grp)

        self.gen_type_combo = QComboBox()
        self.gen_type_combo.addItems(["Visual Spiral (Math)", "Audio Particles", "Wave Oscillations"])
        self.gen_type_combo.currentIndexChanged.connect(self._on_gen_type_changed)
        gen_layout.addWidget(QLabel("Generative Node Type:"))
        gen_layout.addWidget(self.gen_type_combo)

        # Simulated audio reactive inputs
        audio_grp = QGroupBox("Simulated Audio Input Levels (FFT)")
        audio_form = QFormLayout(audio_grp)

        self.sl_bass = QSlider(Qt.Orientation.Horizontal)
        self.sl_bass.setRange(0, 100)
        self.sl_bass.setValue(50)
        self.sl_bass.valueChanged.connect(self._on_audio_sim_changed)
        audio_form.addRow("Bass Amplitude:", self.sl_bass)

        self.sl_mid = QSlider(Qt.Orientation.Horizontal)
        self.sl_mid.setRange(0, 100)
        self.sl_mid.setValue(50)
        self.sl_mid.valueChanged.connect(self._on_audio_sim_changed)
        audio_form.addRow("Mid Range:", self.sl_mid)

        self.sl_treble = QSlider(Qt.Orientation.Horizontal)
        self.sl_treble.setRange(0, 100)
        self.sl_treble.setValue(30)
        self.sl_treble.valueChanged.connect(self._on_audio_sim_changed)
        audio_form.addRow("Treble range:", self.sl_treble)

        gen_layout.addWidget(audio_grp)
        live_layout.addWidget(gen_grp)

        # Timeline Show Playback controls
        time_grp = QGroupBox("Timeline Show & Cue Automation")
        time_layout = QHBoxLayout(time_grp)

        btn_play = QPushButton("Play")
        btn_play.clicked.connect(self._on_play_timeline)
        time_layout.addWidget(btn_play)

        btn_pause = QPushButton("Pause")
        btn_pause.clicked.connect(self._on_pause_timeline)
        time_layout.addWidget(btn_pause)

        btn_stop = QPushButton("Stop")
        btn_stop.clicked.connect(self._on_stop_timeline)
        time_layout.addWidget(btn_stop)

        live_layout.addWidget(time_grp)
        live_layout.addStretch()
        left_tabs.addTab(live_widget, "Control & Live")

        # Tab 3: Color Adjustments & Surfaces
        color_widget = QWidget()
        color_layout = QVBoxLayout(color_widget)

        adjust_grp = QGroupBox("Corrección de Color")
        adjust_form = QFormLayout(adjust_grp)

        self.sl_brightness = QSlider(Qt.Orientation.Horizontal)
        self.sl_brightness.setRange(0, 200) # 0.0 to 2.0
        self.sl_brightness.setValue(100)
        self.sl_brightness.valueChanged.connect(self._on_color_adj_changed)
        adjust_form.addRow("Brightness Offset:", self.sl_brightness)

        self.sl_contrast = QSlider(Qt.Orientation.Horizontal)
        self.sl_contrast.setRange(0, 200)
        self.sl_contrast.setValue(100)
        self.sl_contrast.valueChanged.connect(self._on_color_adj_changed)
        adjust_form.addRow("Contrast Contrast:", self.sl_contrast)

        self.sl_saturation = QSlider(Qt.Orientation.Horizontal)
        self.sl_saturation.setRange(0, 200)
        self.sl_saturation.setValue(100)
        self.sl_saturation.valueChanged.connect(self._on_color_adj_changed)
        adjust_form.addRow("Color Saturation:", self.sl_saturation)

        # 3D LUT
        btn_load_lut = QPushButton("Load Color 3D LUT (.cube)")
        btn_load_lut.clicked.connect(self._on_load_lut)
        adjust_form.addRow("Professional LUT:", btn_load_lut)

        color_layout.addWidget(adjust_grp)

        # Surface Tone Offset group
        surf_grp = QGroupBox("Compensación Cromática de Superficie")
        surf_form = QFormLayout(surf_grp)

        self.surf_combo = QComboBox()
        self.surf_combo.addItems(["White Wall (Standard)", "Gray Concrete", "Red Brick Wall", "Golden Wood Plank"])
        self.surf_combo.currentIndexChanged.connect(self._on_surf_tone_changed)
        surf_form.addRow("Surface Target Base Material:", self.surf_combo)

        color_layout.addWidget(surf_grp)

        # Black level correction
        black_grp = QGroupBox("Black Level Offset (Luz Residual)")
        black_form = QFormLayout(black_grp)

        self.sl_black_lvl = QSlider(Qt.Orientation.Horizontal)
        self.sl_black_lvl.setRange(0, 50) # 0.0 to 0.5
        self.sl_black_lvl.setValue(0)
        self.sl_black_lvl.valueChanged.connect(self._on_black_offset_changed)
        black_form.addRow("Black Lift Level:", self.sl_black_lvl)

        color_layout.addWidget(black_grp)
        color_layout.addStretch()
        left_tabs.addTab(color_widget, "Ajustes de Color")

        main_splitter.addWidget(left_tabs)

        # Right Panel (GL Projection view and live telemetry performance statistics bar)
        right_panel = QWidget()
        right_layout = QVBoxLayout(right_panel)
        right_layout.setContentsMargins(0, 0, 0, 0)

        # Gl Canvas simulated viewport widget
        self.gl_viewer = GLViewWidget()
        right_layout.addWidget(self.gl_viewer, 1)

        # Telemetry info bar
        self.status_bar = QWidget()
        self.status_bar.setFixedHeight(35)
        status_layout = QHBoxLayout(self.status_bar)
        status_layout.setContentsMargins(15, 0, 15, 0)

        self.lbl_fps = QLabel("Telemetry: 60.0 FPS")
        self.lbl_fps.setFont(QFont("Consolas", 9, QFont.Weight.Bold))
        status_layout.addWidget(self.lbl_fps)

        self.lbl_status = QLabel("System Status: OK | Canvas size: 1920x1080")
        self.lbl_status.setFont(QFont("Segoe UI", 9))
        status_layout.addWidget(self.lbl_status, 1, Qt.AlignmentFlag.AlignRight)

        right_layout.addWidget(self.status_bar)
        main_splitter.addWidget(right_panel)

        # Set core widget layout percentages
        main_splitter.setSizes([450, 830])
        self.setCentralWidget(main_splitter)

    def _apply_dark_theme(self):
        """
        Elegant styling mimicking software tools like TouchDesigner and Resolume Arena.
        """
        self.setStyleSheet("""
            QMainWindow {
                background-color: #1a1a1a;
                color: #e0e0e0;
            }
            QTabWidget::pane {
                border: 1px solid #333333;
                background-color: #242424;
            }
            QTabBar::tab {
                background: #1e1e1e;
                color: #a0a0a0;
                padding: 10px 15px;
                border-top-left-radius: 4px;
                border-top-right-radius: 4px;
                margin-right: 2px;
            }
            QTabBar::tab:selected {
                background: #242424;
                color: #C9A227; /* Gold accent */
                border-bottom: 2px solid #C9A227;
            }
            QGroupBox {
                border: 1px solid #3d3d3d;
                border-radius: 6px;
                margin-top: 15px;
                font-weight: bold;
                color: #c0c0c0;
                padding: 15px;
            }
            QGroupBox::title {
                subcontrol-origin: margin;
                left: 10px;
                padding: 0 5px;
            }
            QLabel {
                color: #e0e0e0;
                font-family: "Segoe UI", "Helvetica";
                font-size: 11px;
            }
            QPushButton {
                background-color: #333333;
                border: 1px solid #4a4a4a;
                border-radius: 4px;
                color: #e0e0e0;
                padding: 6px 12px;
                min-width: 80px;
            }
            QPushButton:hover {
                background-color: #107C10; /* Success accent */
                border-color: #107C10;
            }
            QPushButton:pressed {
                background-color: #0c5a0c;
            }
            QComboBox, QSpinBox {
                background-color: #2d2d2d;
                border: 1px solid #4a4a4a;
                border-radius: 4px;
                color: #e0e0e0;
                padding: 4px;
            }
            QSlider::groove:horizontal {
                height: 4px;
                background: #444444;
                border-radius: 2px;
            }
            QSlider::handle:horizontal {
                background: #C9A227;
                border: 1px solid #C9A227;
                width: 14px;
                height: 14px;
                margin: -5px 0;
                border-radius: 7px;
            }
            QSlider::handle:horizontal:hover {
                background: #e5b82b;
            }
            QCheckBox {
                color: #e0e0e0;
            }
            QSplitter::handle {
                background-color: #333333;
            }
        """)
        self.status_bar.setStyleSheet("background-color: #151515; border-top: 1px solid #222222;")

    # --- CALLBACKS & UI HANDLERS ---
    def _on_mesh_res_changed(self, index):
        res_map = {0: 4, 1: 8, 2: 16}
        dim = res_map[index]
        self.mesh_layer.change_resolution(dim, dim)
        self.gl_viewer.mesh_rows = dim
        self.gl_viewer.mesh_cols = dim
        self.gl_viewer.reset_mesh_nodes()
        self.gl_viewer.update()

    def _on_toggle_mesh_handles(self, checked):
        self.gl_viewer.show_mesh_lines = checked
        self.gl_viewer.update()

    def _on_reset_mesh(self):
        self.mesh_layer.reset_mesh()
        self.gl_viewer.reset_mesh_nodes()
        self.gl_viewer.update()

    def _on_cube_rot_changed(self, val):
        self.gl_viewer.update_rotation(val)

    def _on_blend_changed(self):
        self.edge_blender.blend_left = self.sl_blend_left.value() / 100.0
        self.edge_blender.blend_right = self.sl_blend_right.value() / 100.0
        self.edge_blender.gamma = self.sl_blend_gamma.value() / 10.0
        self.gl_viewer.update()

    def _on_gen_type_changed(self, index):
        # Notify shader configuration generator updates
        pass

    def _on_audio_sim_changed(self):
        self.generative.audio_bass = self.sl_bass.value() / 100.0
        self.generative.audio_mid = self.sl_mid.value() / 100.0
        self.generative.audio_treble = self.sl_treble.value() / 100.0

    def _on_play_timeline(self):
        self.timeline.play()
        self.lbl_status.setText("Show Timeline State: Playing")

    def _on_pause_timeline(self):
        self.timeline.pause()
        self.lbl_status.setText("Show Timeline State: Paused")

    def _on_stop_timeline(self):
        self.timeline.stop()
        self.lbl_status.setText("Show Timeline State: Stopped")

    def _on_color_adj_changed(self):
        self.color_corrector.brightness = self.sl_brightness.value() / 100.0
        self.color_corrector.contrast = self.sl_contrast.value() / 100.0
        self.color_corrector.saturation = self.sl_saturation.value() / 100.0

    def _on_load_lut(self):
        filepath, _ = QFileDialog.getOpenFileName(self, "Load professional 3D LUT Cube File", "", "LUT Files (*.cube)")
        if filepath:
            self.color_corrector.load_lut_3d(filepath)

    def _on_surf_tone_changed(self, index):
        tones = {
            0: "#FFFFFF", # standard white
            1: "#7f7f7f", # concrete gray
            2: "#8B4513", # red brick (saddle brown approximation)
            3: "#DAA520"  # wood goldenrod
        }
        self.surface_compensator.set_surface_hex(tones[index])

    def _on_black_offset_changed(self):
        val = (self.sl_black_lvl.value() / 100.0)
        self.black_offset.black_offset_r = val
        self.black_offset.black_offset_g = val
        self.black_offset.black_offset_b = val

    def _on_render_tick(self):
        """
        Coordinates compilation of virtual engine canvas frames, color mappings, and surface offsets.
        """
        # Calculate real-time performance frame rates (FPS Telemetry profiling)
        self.fps_counter += 1
        now = time.time()
        if now - self.last_fps_time >= 1.0:
            self.current_fps = self.fps_counter / (now - self.last_fps_time)
            self.lbl_fps.setText(f"Telemetry: {self.current_fps:.1f} FPS")
            self.fps_counter = 0
            self.last_fps_time = now

        # Compile dynamic visual background content
        frame_type_map = {0: "spiral", 1: "particles", 2: "waves"}
        active_type = frame_type_map[self.gen_type_combo.currentIndex()]

        # Pull generated mathematical base frame
        frame = self.generative.get_generative_frame(active_type, time_sec=now)

        # Color corrections
        frame = self.color_corrector.process_adjustments(frame)

        # Surface chroma neutralization
        frame = self.surface_compensator.compensate_frame(frame)

        # Black level light bleed protection offsets
        frame = self.black_offset.apply_offset(frame)

        # Draw frame update onto screen canvas widget
        self.gl_viewer.set_frame(frame)
