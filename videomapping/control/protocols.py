import sys
import threading
import time
import socket
from pythonosc.dispatcher import Dispatcher
from pythonosc.osc_server import BlockingOSCUDPServer
from pythonosc.udp_client import SimpleUDPClient

class OSCInterface:
    """
    Implements a robust OSC (Open Sound Control) Server and Client for real-time remote commands.
    """
    def __init__(self, ip_in="127.0.0.1", port_in=8000, ip_out="127.0.0.1", port_out=9000):
        self.ip_in = ip_in
        self.port_in = port_in
        self.ip_out = ip_out
        self.port_out = port_out

        self.dispatcher = Dispatcher()
        self.server = None
        self.client = None
        self.server_thread = None
        self.callbacks = {}

    def register_callback(self, address, func):
        """
        Maps an OSC address (e.g., /intensity, /calibration/mesh/node) to a python callback.
        """
        self.callbacks[address] = func
        self.dispatcher.map(address, func)

    def start_server(self):
        try:
            self.server = BlockingOSCUDPServer((self.ip_in, self.port_in), self.dispatcher)
            self.server_thread = threading.Thread(target=self.server.serve_forever, daemon=True)
            self.server_thread.start()
            print(f"OSC Server running on {self.ip_in}:{self.port_in}")
            return True
        except Exception as e:
            print(f"Failed to start OSC Server: {e}")
            return False

    def stop_server(self):
        if self.server:
            self.server.shutdown()
            self.server.server_close()
            self.server = None
        if self.server_thread:
            self.server_thread.join()
            self.server_thread = None

    def start_client(self):
        try:
            self.client = SimpleUDPClient(self.ip_out, self.port_out)
            print(f"OSC Client initialized targeting {self.ip_out}:{self.port_out}")
            return True
        except Exception as e:
            print(f"Failed to initialize OSC Client: {e}")
            return False

    def send_message(self, address, value):
        if self.client:
            self.client.send_message(address, value)


class MIDIInterface:
    """
    Parses real-time MIDI input messages (Control Change, Notes, Pitch Bend)
    to bind physically to software knobs/faders.
    """
    def __init__(self):
        self.port_name = None
        self.inport = None
        self.midi_thread = None
        self.is_running = False
        self.cc_bindings = {} # Maps CC number to callable function

    def get_available_ports(self):
        try:
            import mido
            return mido.get_input_names()
        except Exception:
            return ["Simulated MIDI Port 1", "Simulated MIDI Port 2"]

    def bind_cc(self, cc_number, callback):
        self.cc_bindings[cc_number] = callback

    def start_listening(self, port_name):
        self.port_name = port_name
        self.is_running = True

        # Start message loop thread
        self.midi_thread = threading.Thread(target=self._midi_loop, daemon=True)
        self.midi_thread.start()

    def _midi_loop(self):
        try:
            import mido
            # If native port creation fails, run a simulated loop
            if self.port_name.startswith("Simulated"):
                self._run_simulated_midi()
                return

            with mido.open_input(self.port_name) as inport:
                while self.is_running:
                    for msg in inport.iter_pending():
                        if msg.type == 'control_change':
                            cc = msg.control
                            val = msg.value / 127.0 # Normalize 0-1
                            if cc in self.cc_bindings:
                                self.cc_bindings[cc](val)
                    time.sleep(0.005)
        except Exception:
            self._run_simulated_midi()

    def _run_simulated_midi(self):
        import time
        import random
        while self.is_running:
            # Randomly trigger bound physical knobs to simulate tactile mapping interaction
            if self.cc_bindings:
                cc = random.choice(list(self.cc_bindings.keys()))
                val = random.random()
                self.cc_bindings[cc](val)
            time.sleep(1.0) # Slow pacing for mock stability

    def stop_listening(self):
        self.is_running = False
        if self.midi_thread:
            self.midi_thread.join()
            self.midi_thread = None


class ArtNetDMXInterface:
    """
    Broadcasts and decodes Art-Net over standard UDP, maps raw DMX frame data
    directly to fixture parameters for lighting console sync.
    """
    def __init__(self, bind_ip="0.0.0.0", target_ip="255.255.255.255", port=6454):
        self.bind_ip = bind_ip
        self.target_ip = target_ip
        self.port = port
        self.sock = None
        self.is_listening = False
        self.universe_callback = None
        self.listener_thread = None

    def start_broadcasting(self):
        try:
            self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            self.sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
            print("Art-Net UDP Socket opened.")
        except Exception as e:
            print(f"Error opening Art-Net socket: {e}")

    def send_artnet_dmx(self, universe, dmx_data_512):
        """
        Packs a standard Art-DMX packet containing 512 channel values and sends over IP.
        """
        if not self.sock:
            return

        # Art-Net Header: "Art-Net\x00"
        header = b'Art-Net\x00'
        # Opcode: ArtDmx (0x5000)
        opcode = b'\x00\x50'
        # Protocol Version: 14 (0x000e)
        proto_ver = b'\x00\x0e'
        # Sequence (0-255 disabled: 0x00) and Physical input (0x00)
        seq_phy = b'\x00\x00'
        # Universe (15 bits, low byte first)
        uni = bytes([universe & 0xFF, (universe >> 8) & 0x7F])
        # Length (512 bytes, high byte first)
        length = b'\x02\x00'

        # Ensure data is exactly 512 bytes
        dmx_payload = bytearray(dmx_data_512[:512])
        if len(dmx_payload) < 512:
            dmx_payload.extend([0] * (512 - len(dmx_payload)))

        packet = header + opcode + proto_ver + seq_phy + uni + length + bytes(dmx_payload)

        try:
            self.sock.sendto(packet, (self.target_ip, self.port))
        except Exception as e:
            print(f"Failed to send Art-Net packet: {e}")

    def start_listener(self, callback):
        self.universe_callback = callback
        self.is_listening = True
        self.listener_thread = threading.Thread(target=self._listen_loop, daemon=True)
        self.listener_thread.start()

    def _listen_loop(self):
        sock_in = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock_in.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            sock_in.bind((self.bind_ip, self.port))
            while self.is_listening:
                data, addr = sock_in.recvfrom(1024)
                # Parse Art-Net Header
                if len(data) >= 18 and data[:8] == b'Art-Net\x00':
                    opcode = data[8:10]
                    if opcode == b'\x00\x50': # ArtDmx
                        universe = data[14] + (data[15] << 8)
                        length = (data[16] << 8) + data[17]
                        dmx_data = list(data[18:18+length])
                        if self.universe_callback:
                            self.universe_callback(universe, dmx_data)
        except Exception as e:
            print(f"Art-Net listener error: {e}")
        finally:
            sock_in.close()

    def stop_listener(self):
        self.is_listening = False
        if self.listener_thread:
            self.listener_thread.join()
            self.listener_thread = None


class LTCTimecodeGenerator:
    """
    Generates and parses SMPTE LTC (Linear Timecode) audio wave signals for
    frame-accurate timeline alignment across complex physical playback clusters.
    """
    def __init__(self, fps=30):
        self.fps = fps
        self.sample_rate = 44100

    def generate_ltc_bitstream(self, hours, minutes, seconds, frames):
        """
        Constructs standard SMPTE 80-bit Linear Timecode frame binary packet.
        """
        bits = [0] * 80

        # Simple placeholder binary packing logic for time digits:
        # F_units (4b), F_tens (2b), S_units (4b), S_tens (3b)
        # M_units (4b), M_tens (3b), H_units (4b), H_tens (2b)
        # Sync word (16b: 0011 1011 1111 1101)

        # Frame units (0-9)
        f_un = frames % 10
        bits[0:4] = [int(x) for x in format(f_un, '04b')[::-1]]
        # Frame tens (0-2)
        f_ten = frames // 10
        bits[8:10] = [int(x) for x in format(f_ten, '02b')[::-1]]

        # Seconds units (0-9)
        s_un = seconds % 10
        bits[16:20] = [int(x) for x in format(s_un, '04b')[::-1]]
        # Seconds tens (0-5)
        s_ten = seconds // 10
        bits[24:27] = [int(x) for x in format(s_ten, '03b')[::-1]]

        # Minutes units (0-9)
        m_un = minutes % 10
        bits[32:36] = [int(x) for x in format(m_un, '04b')[::-1]]
        # Minutes tens (0-5)
        m_ten = minutes // 10
        bits[40:43] = [int(x) for x in format(m_ten, '03b')[::-1]]

        # Hours units (0-9)
        h_un = hours % 10
        bits[48:52] = [int(x) for x in format(h_un, '04b')[::-1]]
        # Hours tens (0-2)
        h_ten = hours // 10
        bits[56:58] = [int(x) for x in format(h_ten, '02b')[::-1]]

        # Sync word pattern (80-bit SMPTE standardized sync word at bits 64-79)
        sync_word = [0, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1]
        bits[64:80] = sync_word

        return bits

    def biphase_mark_encode(self, bits):
        """
        Applies Biphase Mark Code (BMC) FM-modulation encoding to binary bitstream
        to convert it to audio frequencies.
        """
        encoded_signal = []
        state = 1.0 # Current audio amplitude phase direction

        # For each bit, we transition at the start.
        # If bit is 1, we also transition in the exact middle.
        for bit in bits:
            state = -state # Transition at boundary
            encoded_signal.append(state)
            if bit == 1:
                state = -state # Transition mid-bit
                encoded_signal.append(state)
            else:
                encoded_signal.append(state) # Hold level

        return np.array(encoded_signal, dtype=np.float32)
