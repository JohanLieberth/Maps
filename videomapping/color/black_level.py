import numpy as np

class BlackLevelOffset:
    """
    Minimizes projector optical light bleed in completely black zones.
    Provides customizable offsets and non-linear contrast response curves.
    """
    def __init__(self):
        # Nivel de negro offset value (0.0 to 1.0)
        self.black_offset_r = 0.0
        self.black_offset_g = 0.0
        self.black_offset_b = 0.0

        # Curva de atenuacion no-lineal exponent (default 1.0 = linear, higher = sharper contrast drop)
        self.attenuation_exponent = 1.0

    def apply_offset(self, frame_rgb):
        """
        Elevates bottom-level black pixels utilizing a non-linear curve to mask leakage.
        Formula:
          Corrected = Offset + (1 - Offset) * (Input ^ Exponent)
        """
        f_norm = frame_rgb.astype(np.float32) / 255.0

        # Apply the non-linear attenuation curve to compress bottom shades
        if self.attenuation_exponent != 1.0:
            f_norm = np.clip(f_norm, 0.0, 1.0) ** self.attenuation_exponent

        # Apply black level padding lift
        f_norm[..., 0] = self.black_offset_r + (1.0 - self.black_offset_r) * f_norm[..., 0]
        f_norm[..., 1] = self.black_offset_g + (1.0 - self.black_offset_g) * f_norm[..., 1]
        f_norm[..., 2] = self.black_offset_b + (1.0 - self.black_offset_b) * f_norm[..., 2]

        res = np.clip(f_norm * 255.0, 0.0, 255.0)
        return res.astype(np.uint8)
