import numpy as np

class VirtualCanvas:
    """
    Unified canvas aggregator. Compiles layers (meshes, masks, generative contents)
    into a high-resolution virtual frame buffer at 60 FPS+.
    """
    def __init__(self, width=1920, height=1080):
        self.width = width
        self.height = height
        self.layers = [] # Holds layer configurations and dynamic contents

        # Base frame canvas (black default)
        self.clear()

    def clear(self):
        self.buffer = np.zeros((self.height, self.width, 3), dtype=np.uint8)

    def add_layer(self, layer_id, content_provider, opacity=1.0, blend_mode="normal"):
        self.layers.append({
            "id": layer_id,
            "provider": content_provider,
            "opacity": opacity,
            "blend_mode": blend_mode,
            "enabled": True
        })

    def update_layer_order(self, order_list):
        # Sort layers by provided order of layer_ids
        self.layers.sort(key=lambda l: order_list.index(l["id"]) if l["id"] in order_list else 999)

    def compile_frame(self):
        """
        Combines layers, processes individual mesh warping and vector masking,
        then renders the composite virtual canvas.
        """
        self.clear()

        for layer in self.layers:
            if not layer["enabled"]:
                continue

            frame = layer["provider"].get_next_frame(self.width, self.height)
            if frame is None:
                continue

            opacity = layer["opacity"]

            # Simple blend stack
            if opacity == 1.0:
                self.buffer = np.clip(self.buffer + frame, 0, 255).astype(np.uint8)
            else:
                blended = (self.buffer.astype(float) * (1.0 - opacity) + frame.astype(float) * opacity)
                self.buffer = np.clip(blended, 0, 255).astype(np.uint8)

        return self.buffer
