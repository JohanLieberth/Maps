import numpy as np

class NDIProtocolMock:
    """
    Simulated implementation of the NDI (Network Device Interface) Protocol
    for ultra low-latency cross-IP video stream broadcast.
    Saves development constraints when physical native NDI SDK is unavailable.
    """
    def __init__(self, name="VideoMapping_Stream"):
        self.name = name
        self.is_sending = False
        self.is_receiving = False
        self.connected_sources = []
        self.active_source = None

    def start_sender(self):
        self.is_sending = True
        print(f"NDI sender started on stream '{self.name}'")

    def stop_sender(self):
        self.is_sending = False
        print(f"NDI sender stopped on stream '{self.name}'")

    def send_frame(self, frame_data):
        if not self.is_sending:
            return False
        # Simulates NDI low latency payload encoding
        # Frame contains height, width, channels
        return True

    def scan_sources(self):
        self.connected_sources = [
            {"name": "CAMERA_SOURCE_1", "ip": "192.168.1.50"},
            {"name": "LIVE_RENDER_GEN", "ip": "192.168.1.101"}
        ]
        return self.connected_sources

    def start_receiver(self, source_name):
        self.is_receiving = True
        self.active_source = source_name
        print(f"NDI connected and receiving from '{source_name}'")

    def receive_frame(self, w=1920, h=1080):
        if not self.is_receiving:
            return None
        # Simulates a low-latency IP camera source stream (returns a colored canvas placeholder)
        frame = np.zeros((h, w, 3), dtype=np.uint8)
        # Add dynamic colored target crosshair for visualization
        cv2_mock_circle(frame, (w // 2, h // 2), 100, (255, 0, 100))
        return frame


class SpoutProtocolMock:
    """
    Simulated platform-agnostic implementation of Spout (Windows) / Syphon (macOS)
    for zero-latency inter-app GPU shared-texture exchange.
    """
    def __init__(self, sender_name="ProjectionCanvas"):
        self.sender_name = sender_name
        self.is_registered = False

    def register_sender(self):
        self.is_registered = True
        print(f"Spout/Syphon registered sender: '{self.sender_name}'")

    def unregister_sender(self):
        self.is_registered = False

    def send_texture_id(self, gl_texture_id, width, height):
        if not self.is_registered:
            return False
        # Simulates pushing physical OpenGL handle into shared inter-process graphic memory
        return True

    def receive_texture(self, sender_name, w=1920, h=1080):
        # Simulates receiving memory-shared hardware buffer texture
        frame = np.zeros((h, w, 3), dtype=np.uint8)
        cv2_mock_circle(frame, (100, 100), 40, (0, 255, 0))
        return frame


def cv2_mock_circle(img, center, radius, color):
    """
    Utility simple drawing for simulated streams.
    """
    cx, cy = center
    h, w = img.shape[:2]
    # Simple bounding box iteration for rendering the circular overlay
    for y in range(max(0, cy - radius), min(h, cy + radius)):
        for x in range(max(0, cx - radius), min(w, cx + radius)):
            if (x - cx)**2 + (y - cy)**2 <= radius**2:
                img[y, x] = color
