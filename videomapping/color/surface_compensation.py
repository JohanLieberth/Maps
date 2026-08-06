import numpy as np

class SurfaceCompensation:
    """
    Adjusts projector outputs to balance and neutralize the underlying physical surface
    tones (e.g., concrete, brick, wood) using a chromatic multiplication-division algorithm.
    """
    def __init__(self):
        # Base surface color representation in linear RGB (0.0 to 1.0)
        # Default is pure white surface (no neutralization needed)
        self.surface_rgb = [1.0, 1.0, 1.0]

    def set_surface_hex(self, hex_str):
        """
        Parses surface tone from standard hex color value.
        """
        hex_str = hex_str.lstrip('#')
        if len(hex_str) == 6:
            r = int(hex_str[0:2], 16) / 255.0
            g = int(hex_str[2:4], 16) / 255.0
            b = int(hex_str[4:6], 16) / 255.0
            self.surface_rgb = [r, g, b]

    def sample_surface_from_frame(self, frame_rgb, x_coord, y_coord, radius=5):
        """
        Extracts average surface color sample from camera feed snapshot.
        """
        h, w = frame_rgb.shape[:2]
        x_min = max(0, x_coord - radius)
        x_max = min(w, x_coord + radius)
        y_min = max(0, y_coord - radius)
        y_max = min(h, y_coord + radius)

        region = frame_rgb[y_min:y_max, x_min:x_max]
        if region.size == 0:
            return

        mean_rgb = np.mean(region, axis=(0, 1))
        self.surface_rgb = [float(c) / 255.0 for c in mean_rgb]

    def compensate_frame(self, frame_rgb):
        """
        Applies chromatic compensation algorithm:
        Resulting frame color = Target frame color * (Surface tone color ^ -1)
        To prevent division by zero or overly blown channels, we clamp and scale safely.
        """
        # Linear normalize
        f_norm = frame_rgb.astype(np.float32) / 255.0

        r_c, g_c, b_c = self.surface_rgb

        # Guard from complete pitch-black values
        r_c = max(0.05, r_c)
        g_c = max(0.05, g_c)
        b_c = max(0.05, b_c)

        # Calculate maximum luminance channel for scale reference
        max_channel = max(r_c, g_c, b_c)

        # Multiply input color channels by inverse surface coefficients
        f_norm[..., 0] *= (max_channel / r_c)
        f_norm[..., 1] *= (max_channel / g_c)
        f_norm[..., 2] *= (max_channel / b_c)

        # Scale back and clamp safely
        comp_frame = np.clip(f_norm * 255.0, 0.0, 255.0)
        return comp_frame.astype(np.uint8)
