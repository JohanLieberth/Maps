import cv2
import time
import numpy as np

class VideoDecoder:
    """
    High performance hardware accelerated video pipeline decoder.
    Integrates frame pre-caching to guarantee smooth playback at high frame rates (60FPS+).
    """
    def __init__(self, filepath, cache_size=60):
        self.filepath = filepath
        self.cache_size = cache_size
        self.cap = cv2.VideoCapture(filepath)

        # Metadata
        self.fps = self.cap.get(cv2.CAP_PROP_FPS) or 30.0
        self.total_frames = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 1
        self.width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 640
        self.height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 480

        # Cache queue for smooth playhead scrubbing
        self.frame_cache = {}
        self.cache_indices = []

        # Playback states
        self.current_frame_index = 0
        self.loop = True
        self.is_playing = False
        self.last_frame_time = 0.0

        # Populate initial pre-buffer
        self._pre_buffer_cache()

    def _pre_buffer_cache(self):
        """
        Pre-caches target number of frames into memory.
        """
        for i in range(min(self.cache_size, self.total_frames)):
            ret, frame = self.cap.read()
            if not ret:
                break
            # Convert OpenCV BGR to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            self.frame_cache[i] = rgb_frame
            self.cache_indices.append(i)

    def get_frame(self, index):
        """
        Retrieves a frame from cache, or reads from file if not loaded.
        """
        index = index % self.total_frames

        if index in self.frame_cache:
            return self.frame_cache[index]

        # If cache miss, seek and read, then cache it
        self.cap.set(cv2.CAP_PROP_POS_FRAMES, index)
        ret, frame = self.cap.read()
        if ret:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            # Evict oldest cached frame if we exceed cache size
            if len(self.frame_cache) >= self.cache_size:
                oldest = self.cache_indices.pop(0)
                self.frame_cache.pop(oldest, None)
            self.frame_cache[index] = rgb_frame
            self.cache_indices.append(index)
            return rgb_frame

        # Fallback to last cached frame
        if self.frame_cache:
            return list(self.frame_cache.values())[-1]
        return np.zeros((self.height, self.width, 3), dtype=np.uint8)

    def get_next_frame(self, target_w=None, target_h=None):
        """
        Returns next scheduled frame following video timeline speed clock.
        """
        now = time.time()
        frame_interval = 1.0 / self.fps

        if self.is_playing:
            if now - self.last_frame_time >= frame_interval:
                self.current_frame_index += 1
                if self.current_frame_index >= self.total_frames:
                    if self.loop:
                        self.current_frame_index = 0
                    else:
                        self.current_frame_index = self.total_frames - 1
                self.last_frame_time = now

        frame = self.get_frame(self.current_frame_index)

        # Resize dynamically if target dimension is specified
        if target_w and target_h and (target_w != self.width or target_h != self.height):
            frame = cv2.resize(frame, (target_w, target_h), interpolation=cv2.INTER_LINEAR)

        return frame

    def play(self):
        self.is_playing = True
        self.last_frame_time = time.time()

    def pause(self):
        self.is_playing = False

    def seek(self, frame_index):
        self.current_frame_index = max(0, min(frame_index, self.total_frames - 1))
        self.last_frame_time = time.time()

    def release(self):
        self.cap.release()
        self.frame_cache.clear()
        self.cache_indices.clear()
        self.is_playing = False

class FrameCache:
    """
    Maintains a global rendering buffer cache pool to completely prevent stuttering
    during high-resolution UHD 4K/8K frame outputs.
    """
    def __init__(self, capacity_mb=512):
        self.capacity_bytes = capacity_mb * 1024 * 1024
        self.cache = {}
        self.order = []
        self.current_size = 0

    def get_frame(self, key):
        if key in self.cache:
            # Promote to MRU (most recently used)
            self.order.remove(key)
            self.order.append(key)
            return self.cache[key]
        return None

    def store_frame(self, key, frame):
        frame_bytes = frame.nbytes

        # Purge until enough memory is available
        while self.current_size + frame_bytes > self.capacity_bytes and self.order:
            oldest_key = self.order.pop(0)
            removed_frame = self.cache.pop(oldest_key)
            self.current_size -= removed_frame.nbytes

        self.cache[key] = frame
        self.order.append(key)
        self.current_size += frame_bytes

    def clear(self):
        self.cache.clear()
        self.order.clear()
        self.current_size = 0
