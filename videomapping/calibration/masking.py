import xml.etree.ElementTree as ET
import numpy as np

class VectorMask:
    """
    Represents a vector mask (polygonal, bezier curves, ellipses) used for cutting
    out mapped structures with customizable logical blending (add, subtract, intersect).
    """
    def __init__(self, name="Mask", mode="subtractive"):
        self.name = name
        # Modes: "additive", "subtractive", "intersective"
        self.mode = mode
        # List of [x, y] coordinates representing the polygon/bezier nodes (normalized 0.0 to 1.0)
        self.points = []
        # Support Bezier control points (list of tuples of [cp1_x, cp1_y, cp2_x, cp2_y] for each point)
        self.control_points = []
        # Type of shape: "polygon", "bezier", "ellipse"
        self.shape_type = "polygon"
        # If ellipse: [center_x, center_y, rx, ry]
        self.ellipse_params = [0.5, 0.5, 0.2, 0.2]

    def add_point(self, x, y, cp1=None, cp2=None):
        self.points.append([float(x), float(y)])
        if cp1 is None:
            cp1 = [float(x), float(y)]
        if cp2 is None:
            cp2 = [float(x), float(y)]
        self.control_points.append([cp1, cp2])

    def load_from_svg_path(self, svg_path_data):
        """
        Rudimentary parser for SVG path data commands (M, L, C, Z) to load manual shapes.
        """
        self.points = []
        self.control_points = []
        self.shape_type = "bezier"

        # Tokenize SVG path string
        import re
        tokens = re.findall(r"([MLCZmlcz])|(-?\d*\.?\d+(?:e[-+]?\d+)?)", svg_path_data)

        cmd = None
        coords = []
        for t in tokens:
            if t[0]:
                cmd = t[0]
                coords = []
            elif t[1]:
                coords.append(float(t[1]))

            if cmd in ['M', 'm', 'L', 'l'] and len(coords) == 2:
                # Add simple point
                self.add_point(coords[0], coords[1])
                coords = []
            elif cmd in ['C', 'c'] and len(coords) == 6:
                # Bezier point
                cp1 = [coords[0], coords[1]]
                cp2 = [coords[2], coords[3]]
                pt = [coords[4], coords[5]]
                self.add_point(pt[0], pt[1], cp1, cp2)
                coords = []

    def evaluate_point_inside(self, x, y):
        """
        Determines if a normalized coordinate (x, y) lies inside this mask.
        Implements ray-casting algorithm for polygons.
        """
        if self.shape_type == "ellipse":
            cx, cy, rx, ry = self.ellipse_params
            if rx == 0 or ry == 0:
                return False
            return (((x - cx) ** 2) / (rx ** 2) + ((y - cy) ** 2) / (ry ** 2)) <= 1.0

        # Ray casting algorithm for polygons
        n = len(self.points)
        if n < 3:
            return False

        inside = False
        p1x, p1y = self.points[0]
        for i in range(n + 1):
            p2x, p2y = self.points[i % n]
            if y > min(p1y, p2y):
                if y <= max(p1y, p2y):
                    if x <= max(p1x, p2x):
                        if p1y != p2y:
                            xints = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                        if p1x == p2x or x <= xints:
                            inside = not inside
            p1x, p1y = p2x, p2y

        return inside

    def apply_mask_to_frame(self, frame_data, mask_layer_evaluations=None):
        """
        Applies masking modes to a numpy frame.
        """
        h, w = frame_data.shape[:2]
        # Calculate full bool array of mask evaluation
        mask_grid = np.zeros((h, w), dtype=bool)

        # Grid indexing
        x_indices = np.linspace(0, 1, w)
        y_indices = np.linspace(0, 1, h)
        xx, yy = np.meshgrid(x_indices, y_indices)

        if self.shape_type == "ellipse":
            cx, cy, rx, ry = self.ellipse_params
            mask_grid = (((xx - cx) ** 2) / (rx ** 2) + ((yy - cy) ** 2) / (ry ** 2)) <= 1.0
        elif len(self.points) >= 3:
            # Vectorized point-in-polygon using matplotlib or manual ray casting
            # For simplicity & stability, we evaluate directly or run a fast loop
            # Here is a robust ray-casting vectorized implementation:
            n = len(self.points)
            p1x, p1y = self.points[0]
            for i in range(n + 1):
                p2x, p2y = self.points[i % n]
                cond1 = (yy > min(p1y, p2y)) & (yy <= max(p1y, p2y))
                if np.any(cond1):
                    # compute intersection points
                    if p1y != p2y:
                        xints = (yy[cond1] - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                        cond2 = xx[cond1] <= xints
                        mask_grid[cond1] ^= cond2
                p1x, p1y = p2x, p2y

        return mask_grid

    def to_dict(self):
        return {
            "name": self.name,
            "mode": self.mode,
            "points": self.points,
            "control_points": self.control_points,
            "shape_type": self.shape_type,
            "ellipse_params": self.ellipse_params
        }

    def from_dict(self, d):
        self.name = d.get("name", self.name)
        self.mode = d.get("mode", self.mode)
        self.points = d.get("points", [])
        self.control_points = d.get("control_points", [])
        self.shape_type = d.get("shape_type", self.shape_type)
        self.ellipse_params = d.get("ellipse_params", self.ellipse_params)
