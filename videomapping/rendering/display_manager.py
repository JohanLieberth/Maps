import sys
from PyQt6.QtGui import QGuiApplication
from PyQt6.QtCore import QRect

class DisplayManager:
    """
    Manages connected display screens dynamically, and provisions virtual extended canvas mappings.
    Assigns content targets independently across all physical GPU outputs.
    """
    def __init__(self):
        self.app = QGuiApplication.instance() or QGuiApplication(sys.argv)
        self.displays = []
        self.update_displays()

    def update_displays(self):
        """
        Queries system for all attached monitors and populates their dimensions.
        """
        screens = self.app.screens()
        self.displays = []
        for index, screen in enumerate(screens):
            geom = screen.geometry()
            self.displays.append({
                "id": index,
                "name": screen.name(),
                "x": geom.x(),
                "y": geom.y(),
                "width": geom.width(),
                "height": geom.height(),
                "primary": screen == self.app.primaryScreen(),
                "refresh_rate": screen.refreshRate()
            })
        return self.displays

    def get_canvas_bounds(self):
        """
        Returns a bounding box containing all displays for the virtual workspace.
        """
        if not self.displays:
            return 0, 0, 1920, 1080

        xs = [d["x"] for d in self.displays]
        ys = [d["y"] for d in self.displays]
        widths = [d["x"] + d["width"] for d in self.displays]
        heights = [d["y"] + d["height"] for d in self.displays]

        min_x = min(xs)
        min_y = min(ys)
        max_w = max(widths) - min_x
        max_h = max(heights) - min_y

        return min_x, min_y, max_w, max_h

    def get_extended_canvas_mapping(self, virtual_width, virtual_height):
        """
        Configures slicing coordinates to distribute sectors of a single virtual canvas
        to multiple physical physical displays.
        """
        self.update_displays()
        mappings = []

        if not self.displays:
            return mappings

        # Distribute horizontal/vertical based on display geometry relative placement
        min_x = min(d["x"] for d in self.displays)
        max_w = max(d["x"] + d["width"] for d in self.displays) - min_x

        for disp in self.displays:
            # Normalized position of display in global desktop coordinate system
            norm_x = (disp["x"] - min_x) / max_w if max_w > 0 else 0
            norm_width = disp["width"] / max_w if max_w > 0 else 1

            # Map corresponding virtual texture coordinate slice
            slice_u_start = norm_x
            slice_u_end = norm_x + norm_width

            mappings.append({
                "display_id": disp["id"],
                "display_name": disp["name"],
                "physical_rect": (disp["x"], disp["y"], disp["width"], disp["height"]),
                "uv_slice": (slice_u_start, 0.0, slice_u_end, 1.0) # sub-rectangle of virtual canvas
            })

        return mappings
