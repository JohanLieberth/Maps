import numpy as np

class EdgeBlendingControl:
    """
    Implements horizontal and vertical edge blending for adjacent projector overlapping zones.
    Uses gamma correction and cosine/smoothstep blending algorithms.
    """
    def __init__(self):
        # Left, Right, Top, Bottom overlap size (as fraction of output, e.g. 0.15 = 15%)
        self.blend_left = 0.0
        self.blend_right = 0.0
        self.blend_top = 0.0
        self.blend_bottom = 0.0

        # Gamma settings
        self.gamma = 2.2
        self.brightness_correction = 1.0 # Multiplier for overall overlap zone brightness

        # Power / shape of blending curve
        self.blend_exponent = 2.0

    def get_blend_factor(self, x, y):
        """
        Computes the blending multiplier (0.0 to 1.0) for a given normalized screen pixel (x, y).
        x, y are from 0.0 to 1.0.
        """
        factor = 1.0

        # Left edge blend zone
        if self.blend_left > 0.0 and x < self.blend_left:
            t = x / self.blend_left
            factor *= self._apply_curve(t)

        # Right edge blend zone
        if self.blend_right > 0.0 and x > (1.0 - self.blend_right):
            t = (1.0 - x) / self.blend_right
            factor *= self._apply_curve(t)

        # Top edge blend zone
        if self.blend_top > 0.0 and y < self.blend_top:
            t = y / self.blend_top
            factor *= self._apply_curve(t)

        # Bottom edge blend zone
        if self.blend_bottom > 0.0 and y > (1.0 - self.blend_bottom):
            t = (1.0 - y) / self.blend_bottom
            factor *= self._apply_curve(t)

        # Apply extra brightness correction factor where blending occurs
        if factor < 1.0:
            # Boost brightness in blending region to offset luminance loss
            factor = factor * self.brightness_correction
            factor = min(1.0, factor)

        return factor

    def _apply_curve(self, t):
        """
        Applies a smooth gamma/exponent blended transition.
        t is between 0.0 and 1.0.
        """
        t = max(0.0, min(1.0, t))
        # standard cosine curve or polynomial power curve
        # Curve blending function standard: 3t^2 - 2t^3
        smooth_t = 3 * (t ** 2) - 2 * (t ** 3)

        # Apply gamma curve offset to linear blend
        return smooth_t ** (1.0 / self.gamma)

    def process_image(self, img_array):
        """
        Apply edge blending to a numpy RGB/RGBA image in real-time.
        """
        h, w = img_array.shape[:2]
        # Build 2D blending map
        x_indices = np.linspace(0, 1, w)
        y_indices = np.linspace(0, 1, h)
        xx, yy = np.meshgrid(x_indices, y_indices)

        # Vectorized factor calculation
        factors = np.ones((h, w), dtype=np.float32)

        if self.blend_left > 0.0:
            mask = xx < self.blend_left
            t = xx[mask] / self.blend_left
            factors[mask] *= (3 * (t ** 2) - 2 * (t ** 3)) ** (1.0 / self.gamma)

        if self.blend_right > 0.0:
            mask = xx > (1.0 - self.blend_right)
            t = (1.0 - xx[mask]) / self.blend_right
            factors[mask] *= (3 * (t ** 2) - 2 * (t ** 3)) ** (1.0 / self.gamma)

        if self.blend_top > 0.0:
            mask = yy < self.blend_top
            t = yy[mask] / self.blend_top
            factors[mask] *= (3 * (t ** 2) - 2 * (t ** 3)) ** (1.0 / self.gamma)

        if self.blend_bottom > 0.0:
            mask = yy > (1.0 - self.blend_bottom)
            t = (1.0 - yy[mask]) / self.blend_bottom
            factors[mask] *= (3 * (t ** 2) - 2 * (t ** 3)) ** (1.0 / self.gamma)

        # Boost/dim overall blending overlap brightness where factor is below 1.0
        factors[factors < 1.0] *= self.brightness_correction
        factors = np.clip(factors, 0.0, 1.0)

        # Apply to image
        out = img_array.astype(np.float32)
        if len(out.shape) == 3:
            for i in range(min(3, out.shape[2])):
                out[:, :, i] *= factors
        else:
            out *= factors

        return out.astype(img_array.dtype)

    def to_dict(self):
        return {
            "blend_left": self.blend_left,
            "blend_right": self.blend_right,
            "blend_top": self.blend_top,
            "blend_bottom": self.blend_bottom,
            "gamma": self.gamma,
            "brightness_correction": self.brightness_correction,
            "blend_exponent": self.blend_exponent
        }

    def from_dict(self, d):
        self.blend_left = d.get("blend_left", self.blend_left)
        self.blend_right = d.get("blend_right", self.blend_right)
        self.blend_top = d.get("blend_top", self.blend_top)
        self.blend_bottom = d.get("blend_bottom", self.blend_bottom)
        self.gamma = d.get("gamma", self.gamma)
        self.brightness_correction = d.get("brightness_correction", self.brightness_correction)
        self.blend_exponent = d.get("blend_exponent", self.blend_exponent)
