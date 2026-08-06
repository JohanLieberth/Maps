import math
import random
import numpy as np

class Particle2D:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.vx = random.uniform(-2, 2)
        self.vy = random.uniform(-4, -1)
        self.life = 1.0 # 0.0 to 1.0 lifespan
        self.decay = random.uniform(0.01, 0.03)
        self.color = (random.randint(100, 255), random.randint(150, 255), random.randint(200, 255))

    def update(self, gravity=0.1):
        self.x += self.vx
        self.y += self.vy
        self.vy += gravity # apply simple down/up gravity pull
        self.life -= self.decay


class GenerativeEngine:
    """
    Houses dynamic mathematical textures (Perlin Noise, Sine Wave oscillations,
    high performance particles, audio-reactive FFT analysers, and GLSL shaders).
    """
    def __init__(self, width=640, height=480):
        self.width = width
        self.height = height
        self.particles = []
        self.emitter_x = width // 2
        self.emitter_y = height - 50

        # Audio reaction state frequencies
        self.audio_bass = 0.5
        self.audio_mid = 0.5
        self.audio_treble = 0.5

        # Shader source configurations (basic checkerboard/sinusoidal GLSL)
        self.glsl_vertex_shader = """
        #version 330 core
        layout (location = 0) in vec3 aPos;
        layout (location = 1) in vec2 aTexCoord;
        out vec2 TexCoord;
        void main() {
            gl_Position = vec4(aPos, 1.0);
            TexCoord = aTexCoord;
        }
        """
        self.glsl_fragment_shader = """
        #version 330 core
        out vec4 FragColor;
        in vec2 TexCoord;
        uniform float time;
        uniform vec3 audioFreq; // (bass, mid, treble)
        void main() {
            vec2 uv = TexCoord - vec2(0.5);
            float r = length(uv) * (1.0 + audioFreq.x);
            float theta = atan(uv.y, uv.x);
            float spiral = sin(r * 30.0 - time * 5.0 + theta * 5.0);
            vec3 col = 0.5 + 0.5 * cos(time + vec3(0.0, 2.0, 4.0));
            FragColor = vec4(col * (spiral * 0.5 + 0.5), 1.0);
        }
        """

    def process_audio_fft(self, audio_buffer):
        """
        Analyses a real-time audio chunk, performs FFT frequency binning
        to drive visual displacement parameters.
        """
        if len(audio_buffer) == 0:
            return

        # Fast Fourier Transform using numpy
        fft_data = np.abs(np.fft.rfft(audio_buffer))
        if len(fft_data) < 3:
            return

        # Segment into Bass, Mid, Treble frequency bands
        chunk_size = len(fft_data) // 3
        self.audio_bass = float(np.mean(fft_data[0:chunk_size]))
        self.audio_mid = float(np.mean(fft_data[chunk_size:2*chunk_size]))
        self.audio_treble = float(np.mean(fft_data[2*chunk_size:]))

        # Normalize/clamp scale
        max_val = max(1e-5, self.audio_bass, self.audio_mid, self.audio_treble)
        self.audio_bass /= max_val
        self.audio_mid /= max_val
        self.audio_treble /= max_val

    def update_particles(self):
        # Spawn new particles according to audio energy
        spawn_count = int(1 + self.audio_bass * 5)
        for _ in range(spawn_count):
            self.particles.append(Particle2D(self.emitter_x, self.emitter_y))

        # Update alive ones
        alive = []
        for p in self.particles:
            p.update(gravity=-0.05 * self.audio_mid)
            if p.life > 0:
                alive.append(p)
        self.particles = alive

    def get_generative_frame(self, frame_type="spiral", time_sec=0.0):
        """
        Generates mathematical, audio-reactive pixel maps (e.g., plasma, noise, spirals).
        """
        frame = np.zeros((self.height, self.width, 3), dtype=np.uint8)

        if frame_type == "spiral":
            # Generate mathematical radial spiral target
            x_idx = np.linspace(-0.5, 0.5, self.width)
            y_idx = np.linspace(-0.5, 0.5, self.height)
            xx, yy = np.meshgrid(x_idx, y_idx)

            r = np.sqrt(xx**2 + yy**2) * (1.0 + self.audio_bass)
            theta = np.arctan2(yy, xx)

            # Oscillating trigonometric shape
            wave = np.sin(r * 25.0 - time_sec * 4.0 + theta * 4.0)
            img_val = ((wave * 0.5 + 0.5) * 255).astype(np.uint8)

            frame[:, :, 0] = img_val
            frame[:, :, 1] = (img_val.astype(float) * self.audio_mid).astype(np.uint8)
            frame[:, :, 2] = (img_val.astype(float) * self.audio_treble).astype(np.uint8)

        elif frame_type == "particles":
            self.update_particles()
            for p in self.particles:
                px, py = int(p.x), int(p.y)
                if 0 <= px < self.width and 0 <= py < self.height:
                    # Draw simple particle square glow
                    radius = int(2 + 4 * p.life * self.audio_mid)
                    x_start = max(0, px - radius)
                    x_end = min(self.width, px + radius)
                    y_start = max(0, py - radius)
                    y_end = min(self.height, py + radius)

                    frame[y_start:y_end, x_start:x_end] = [
                        int(p.color[0] * p.life),
                        int(p.color[1] * p.life),
                        int(p.color[2] * p.life)
                    ]

        elif frame_type == "waves":
            # Wave horizontal stripes
            y_indices = np.arange(self.height)
            phase = time_sec * 5.0
            wave_displacement = (10.0 + self.audio_bass * 40.0)

            for col in range(self.width):
                freq = (col / self.width) * 2.0 * math.pi
                sine_y = np.sin(freq + phase) * wave_displacement + (self.height / 2.0)
                # Draw lines
                for p_y in range(max(0, int(sine_y) - 5), min(self.height, int(sine_y) + 5)):
                    frame[p_y, col] = (100, 200, 255)

        return frame
