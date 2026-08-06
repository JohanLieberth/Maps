import time

class Cue:
    """
    Represents an event trigger on the timeline (e.g., jump to time, load clip, play visual shader).
    """
    def __init__(self, cue_id, name, time_ms, action, target_param=None, target_value=None):
        self.cue_id = cue_id
        self.name = name
        self.time_ms = time_ms
        self.action = action # "PLAY_CLIP", "PAUSE", "GOTO", "SET_COLOR"
        self.target_param = target_param
        self.target_value = target_value
        self.triggered = False

class TimelineClip:
    """
    Represents a media clip situated inside a track with playback modes:
    loop, bounce, one-shot, or hold.
    """
    def __init__(self, clip_id, file_path, start_ms, duration_ms, track_id=0):
        self.clip_id = clip_id
        self.file_path = file_path
        self.start_ms = start_ms
        self.duration_ms = duration_ms
        self.track_id = track_id

        # Playback configuration modes: "loop", "bounce", "one-shot", "hold"
        self.play_mode = "loop"
        self.is_active = True
        self.speed = 1.0

        # Internal bounce state direction
        self.bounce_forward = True

    def calculate_clip_time(self, current_time_ms):
        """
        Determines the internal relative playhead time (ms) based on the playback behavior mode.
        """
        if current_time_ms < self.start_ms:
            return 0

        rel_time = (current_time_ms - self.start_ms) * self.speed

        if self.play_mode == "one-shot":
            if rel_time >= self.duration_ms:
                return self.duration_ms
            return rel_time

        elif self.play_mode == "hold":
            if rel_time >= self.duration_ms:
                return self.duration_ms
            return rel_time

        elif self.play_mode == "loop":
            return rel_time % self.duration_ms

        elif self.play_mode == "bounce":
            cycle = rel_time // self.duration_ms
            remainder = rel_time % self.duration_ms
            if cycle % 2 == 0:
                return remainder
            else:
                return self.duration_ms - remainder

        return 0


class TimelineController:
    """
    Coordinates multi-track show playback, manual live clips, cues, and synchronization timecodes.
    """
    def __init__(self):
        # Modes: "Show" (sequential automation) vs "Live" (discretionary manual click actions)
        self.mode = "Show"

        self.tracks = {0: [], 1: [], 2: []} # Tracks list of TimelineClips
        self.cues = []

        self.playhead_ms = 0.0
        self.is_playing = False
        self.last_update_time = 0.0

        self.live_trigger_slots = {} # For "Live" mode clip assignments

    def play(self):
        self.is_playing = True
        self.last_update_time = time.time()

    def pause(self):
        self.is_playing = False

    def stop(self):
        self.is_playing = False
        self.playhead_ms = 0.0
        self.reset_cues()

    def add_clip(self, clip):
        if clip.track_id not in self.tracks:
            self.tracks[clip.track_id] = []
        self.tracks[clip.track_id].append(clip)

    def add_cue(self, cue):
        self.cues.append(cue)
        self.cues.sort(key=lambda c: c.time_ms)

    def reset_cues(self):
        for cue in self.cues:
            cue.triggered = False

    def update(self):
        """
        Increments the playback timeline clock and evaluates active cues and track clips.
        """
        if not self.is_playing:
            return []

        now = time.time()
        elapsed_ms = (now - self.last_update_time) * 1000.0
        self.playhead_ms += elapsed_ms
        self.last_update_time = now

        # Detect and fire cues matching the elapsed time sector
        triggered_events = []
        for cue in self.cues:
            if not cue.triggered and self.playhead_ms >= cue.time_ms:
                cue.triggered = True
                triggered_events.append(cue)

        return triggered_events

    def get_active_clips(self):
        """
        Queries all tracks and returns clips whose timelines intersect with current playhead.
        """
        active = []
        for track_id, clips in self.tracks.items():
            for clip in clips:
                if clip.start_ms <= self.playhead_ms <= (clip.start_ms + clip.duration_ms):
                    active.append(clip)
        return active
