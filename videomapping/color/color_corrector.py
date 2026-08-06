import numpy as np

class ColorCorrector:
    """
    Applies real-time color grading adjustments per projector. Includes brightness, contrast,
    saturation, curves, and 1D / 3D LUT (Look-Up Table) processing.
    """
    def __init__(self):
        self.brightness = 1.0 # Multiplier (0.0 to 2.0)
        self.contrast = 1.0   # Scale (0.0 to 2.0)
        self.saturation = 1.0 # Saturation factor (0.0 to 2.0)
        self.gamma = 1.0      # Gamma curve correction

        # Color Channels gamma offset
        self.gamma_r = 1.0
        self.gamma_g = 1.0
        self.gamma_b = 1.0

        # Loaded LUT properties
        self.lut_3d = None # Expected numpy array of dimensions (N, N, N, 3) where N=32 or N=64
        self.lut_size = 0

    def load_lut_3d(self, filepath_or_cube):
        """
        Parses professional .cube (3D LUT) files used in video production grading.
        """
        try:
            # Simple cube parser implementation
            lines = []
            if isinstance(filepath_or_cube, str):
                with open(filepath_or_cube, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
            else:
                lines = filepath_or_cube # assume list of strings

            lut_data = []
            for line in lines:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                if line.startswith('LUT_3D_SIZE'):
                    self.lut_size = int(line.split()[1])
                    continue
                # Read rgb color coords
                parts = line.split()
                if len(parts) == 3:
                    try:
                        lut_data.append([float(x) for x in parts])
                    except ValueError:
                        pass

            if self.lut_size > 0 and len(lut_data) == (self.lut_size ** 3):
                self.lut_3d = np.array(lut_data).reshape((self.lut_size, self.lut_size, self.lut_size, 3))
                print(f"Loaded 3D LUT successfully. Size: {self.lut_size}")
                return True
            return False
        except Exception as e:
            print(f"Error parsing 3D LUT: {e}")
            return False

    def apply_lut_to_frame(self, frame_rgb):
        """
        Transforms a numpy image through the loaded 3D LUT using tri-linear interpolation mapping.
        """
        if self.lut_3d is None:
            return frame_rgb

        h, w = frame_rgb.shape[:2]
        # Normalize image values between 0.0 and 1.0
        normalized = frame_rgb.astype(np.float32) / 255.0

        # Compute coordinates mapping into 3D LUT volume indices
        indices = normalized * (self.lut_size - 1)

        # Lower bound index
        idx_low = np.floor(indices).astype(int)
        idx_low = np.clip(idx_low, 0, self.lut_size - 2)
        idx_high = idx_low + 1

        # Interpolation fractions
        d = indices - idx_low

        # Tri-linear interpolation equation over 8 neighboring nodes
        c000 = self.lut_3d[idx_low[..., 0], idx_low[..., 1], idx_low[..., 2]]
        c100 = self.lut_3d[idx_high[..., 0], idx_low[..., 1], idx_low[..., 2]]
        c010 = self.lut_3d[idx_low[..., 0], idx_high[..., 1], idx_low[..., 2]]
        c110 = self.lut_3d[idx_high[..., 0], idx_high[..., 1], idx_low[..., 2]]
        c001 = self.lut_3d[idx_low[..., 0], idx_low[..., 1], idx_high[..., 2]]
        c101 = self.lut_3d[idx_high[..., 0], idx_low[..., 1], idx_high[..., 2]]
        c011 = self.lut_3d[idx_low[..., 0], idx_high[..., 1], idx_high[..., 2]]
        c111 = self.lut_3d[idx_high[..., 0], idx_high[..., 1], idx_high[..., 2]]

        # Interpolate along X axis
        d_x = d[..., 0, np.newaxis]
        c00 = c000 * (1 - d_x) + c100 * d_x
        c01 = c001 * (1 - d_x) + c101 * d_x
        c10 = c010 * (1 - d_x) + c110 * d_x
        c11 = c011 * (1 - d_x) + c111 * d_x

        # Interpolate along Y axis
        d_y = d[..., 1, np.newaxis]
        c0 = c00 * (1 - d_y) + c10 * d_y
        c1 = c01 * (1 - d_y) + c11 * d_y

        # Interpolate along Z axis
        d_z = d[..., 2, np.newaxis]
        result = c0 * (1 - d_z) + c1 * d_z

        # Scale back to 8-bit RGB range
        return np.clip(result * 255.0, 0, 255).astype(np.uint8)

    def process_adjustments(self, frame_rgb):
        """
        Applies brightness, contrast, saturation, and gamma curves dynamically.
        """
        # Linear normalization for fast operations
        out = frame_rgb.astype(np.float32) / 255.0

        # 1. Contrast Adjustment around mid-gray pivot (0.5)
        if self.contrast != 1.0:
            out = (out - 0.5) * self.contrast + 0.5

        # 2. Brightness Adjustment
        if self.brightness != 1.0:
            out = out * self.brightness

        # 3. Saturation Adjustment (using standard luminance coefficients)
        if self.saturation != 1.0:
            # Rec.709 coefficients
            luminance = 0.2126 * out[..., 0] + 0.7152 * out[..., 1] + 0.0722 * out[..., 2]
            luminance = luminance[..., np.newaxis]
            out = luminance + (out - luminance) * self.saturation

        # 4. Independent RGB Gamma curves correction
        if self.gamma != 1.0:
            out = np.clip(out, 0.0, 1.0) ** (1.0 / self.gamma)

        if self.gamma_r != 1.0 or self.gamma_g != 1.0 or self.gamma_b != 1.0:
            out = np.clip(out, 0.0, 1.0)
            out[..., 0] = out[..., 0] ** (1.0 / self.gamma_r)
            out[..., 1] = out[..., 1] ** (1.0 / self.gamma_g)
            out[..., 2] = out[..., 2] ** (1.0 / self.gamma_b)

        # Clip, scale, and cast back
        out_clipped = np.clip(out * 255.0, 0.0, 255.0)
        return out_clipped.astype(np.uint8)

    def to_dict(self):
        return {
            "brightness": self.brightness,
            "contrast": self.contrast,
            "saturation": self.saturation,
            "gamma": self.gamma,
            "gamma_r": self.gamma_r,
            "gamma_g": self.gamma_g,
            "gamma_b": self.gamma_b,
            "lut_size": self.lut_size
        }

    def from_dict(self, d):
        self.brightness = d.get("brightness", self.brightness)
        self.contrast = d.get("contrast", self.contrast)
        self.saturation = d.get("saturation", self.saturation)
        self.gamma = d.get("gamma", self.gamma)
        self.gamma_r = d.get("gamma_r", self.gamma_r)
        self.gamma_g = d.get("gamma_g", self.gamma_g)
        self.gamma_b = d.get("gamma_b", self.gamma_b)
