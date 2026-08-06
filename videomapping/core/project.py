import json
import os

class Project:
    """
    Manages loading, saving, and holding the state of a Video Mapping project.
    Can be serialized/deserialized fully from/to a JSON file.
    """
    def __init__(self):
        self.filepath = None
        self.name = "New Video Mapping Project"

        # Mesh warping presets (list of dicts, each with layer name, resolution, and control points)
        self.meshes = []

        # Masking models
        self.masks = []

        # Outputs configurations (list of dicts representing display setup)
        self.outputs = []

        # 3D model calibration targets
        self.calibrations_3d = []

        # Color corrections (per-display dicts containing curves, gamma, LUT paths, etc.)
        self.color_corrections = {}

        # Control configurations (OSC/MIDI mappings, etc.)
        self.controls = {
            "osc_port_in": 8000,
            "osc_port_out": 9000,
            "osc_ip_out": "127.0.0.1",
            "midi_port_in": "",
            "artnet_universe": 0,
            "artnet_subnet": 0,
            "artnet_net": 0
        }

        # Playback timeline clips
        self.timeline_clips = []

    def load_from_json(self, filepath):
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Project file not found: {filepath}")
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        self.filepath = filepath
        self.name = data.get("name", self.name)
        self.meshes = data.get("meshes", [])
        self.masks = data.get("masks", [])
        self.outputs = data.get("outputs", [])
        self.calibrations_3d = data.get("calibrations_3d", [])
        self.color_corrections = data.get("color_corrections", {})
        self.controls = data.get("controls", self.controls)
        self.timeline_clips = data.get("timeline_clips", [])

    def save_to_json(self, filepath=None):
        target_path = filepath or self.filepath
        if not target_path:
            raise ValueError("No destination path provided for saving.")

        data = {
            "name": self.name,
            "meshes": self.meshes,
            "masks": self.masks,
            "outputs": self.outputs,
            "calibrations_3d": self.calibrations_3d,
            "color_corrections": self.color_corrections,
            "controls": self.controls,
            "timeline_clips": self.timeline_clips
        }

        with open(target_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4)
        self.filepath = target_path

    def to_dict(self):
        return {
            "name": self.name,
            "meshes": self.meshes,
            "masks": self.masks,
            "outputs": self.outputs,
            "calibrations_3d": self.calibrations_3d,
            "color_corrections": self.color_corrections,
            "controls": self.controls,
            "timeline_clips": self.timeline_clips
        }

    def load_from_dict(self, data):
        self.name = data.get("name", self.name)
        self.meshes = data.get("meshes", [])
        self.masks = data.get("masks", [])
        self.outputs = data.get("outputs", [])
        self.calibrations_3d = data.get("calibrations_3d", [])
        self.color_corrections = data.get("color_corrections", {})
        self.controls = data.get("controls", self.controls)
        self.timeline_clips = data.get("timeline_clips", [])
