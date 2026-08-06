import sys
from PyQt6.QtWidgets import QWidget
from PyQt6.QtCore import Qt, QTimer
from PyQt6.QtGui import QPainter, QColor, QPen, QBrush, QImage
import numpy as np

class GLViewWidget(QWidget):
    """
    Subclass simulating high-performance OpenGL-based hardware renderer.
    Renders 3D geometries, meshes, warp lines, and color compensations in real time.
    Provides fallback raster-based QPainter engine when physical GL surface context is missing.
    """
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setMinimumSize(400, 300)

        # Internal canvas resolution
        self.canvas_w = 1920
        self.canvas_h = 1080

        # Frame buffers
        self.raw_frame = np.zeros((self.canvas_h, self.canvas_w, 3), dtype=np.uint8)
        self.warped_frame = None

        # Active overlay options
        self.show_mesh_lines = True
        self.selected_node = None # [row, col]

        # Cube 3D projection representation
        self.cube_rotation_y = 0.0

        # Track 2D Mesh nodes (Default 4x4)
        self.mesh_rows = 4
        self.mesh_cols = 4
        self.mesh_nodes = []
        self.reset_mesh_nodes()

        # Drag node state
        self.dragged_node = None # (row, col)

    def reset_mesh_nodes(self):
        self.mesh_nodes = []
        for r in range(self.mesh_rows + 1):
            row_pts = []
            y = r / self.mesh_rows
            for c in range(self.mesh_cols + 1):
                x = c / self.mesh_cols
                row_pts.append([x, y])
            self.mesh_nodes.append(row_pts)

    def set_frame(self, frame_np):
        """
        Receives real-time frame matrices from decoder/generator pipeline.
        """
        self.raw_frame = frame_np
        self.update()

    def update_rotation(self, deg):
        self.cube_rotation_y = deg
        self.update()

    def mousePressEvent(self, event):
        pos = event.position()
        px, py = pos.x(), pos.y()
        w, h = self.width(), self.height()

        # Find closest mesh node within picking threshold radius
        threshold = 15.0
        self.dragged_node = None

        for r in range(self.mesh_rows + 1):
            for c in range(self.mesh_cols + 1):
                node_x = self.mesh_nodes[r][c][0] * w
                node_y = self.mesh_nodes[r][c][1] * h
                dist = ((px - node_x)**2 + (py - node_y)**2) ** 0.5
                if dist < threshold:
                    self.dragged_node = (r, c)
                    self.selected_node = (r, c)
                    self.update()
                    return

    def mouseMoveEvent(self, event):
        if self.dragged_node is not None:
            r, c = self.dragged_node
            pos = event.position()
            # Normalize to 0-1
            nx = max(0.0, min(1.0, pos.x() / self.width()))
            ny = max(0.0, min(1.0, pos.y() / self.height()))
            self.mesh_nodes[r][c] = [nx, ny]
            self.update()

    def mouseReleaseEvent(self, event):
        self.dragged_node = None

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)

        # Background fill
        painter.fillRect(self.rect(), QColor(15, 15, 15))

        w, h = self.width(), self.height()

        # RENDER COMPILED UNDERLYING VIDEO/GENERATIVE CONTENT
        self._draw_compiled_frame(painter, w, h)

        # RENDER 3D PROJECTED CUBE TARGET DEMO
        self._draw_projected_cube(painter, w, h)

        # Draw Mesh Calibration Warping Overlay
        if self.show_mesh_lines:
            self._draw_mesh_lines(painter, w, h)

    def _draw_compiled_frame(self, painter, w, h):
        """
        Draws the active raw_frame as a QImage stretched to fill the viewport,
        or performs a warped texture/mesh drawing representation.
        """
        if self.raw_frame is None or self.raw_frame.size == 0:
            return

        fh, fw, fc = self.raw_frame.shape
        # Convert numpy RGB to QImage
        qimg = QImage(self.raw_frame.data, fw, fh, fw * fc, QImage.Format.Format_RGB888)

        # Fit QImage to current view widget size
        painter.drawImage(self.rect(), qimg)

    def _draw_projected_cube(self, painter, w, h):
        """
        Renders a rotating projected 3D Wireframe Cube to simulate Direct Linear Transform projection.
        """
        cx, cy = w // 2, h // 2
        size = min(w, h) // 4

        # 3D Coordinates of a unit cube
        vertices = np.array([
            [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
            [-1, -1, 1],  [1, -1, 1],  [1, 1, 1],  [-1, 1, 1]
        ], dtype=np.float32) * size

        # Simple Y Rotation matrix rotation
        angle = np.radians(self.cube_rotation_y)
        cos_a, sin_a = np.cos(angle), np.sin(angle)
        rot_y = np.array([
            [cos_a, 0, sin_a],
            [0, 1, 0],
            [-sin_a, 0, cos_a]
        ])

        rotated = vertices.dot(rot_y.T)

        # Weak perspective depth projection coefficient
        projected = []
        for x, y, z in rotated:
            # Shift along z-axis for camera depth
            z_offset = z + size * 3
            if z_offset == 0:
                z_offset = 1
            proj_x = cx + int(x * (size * 3) / z_offset)
            proj_y = cy + int(y * (size * 3) / z_offset)
            projected.append((proj_x, proj_y))

        # Wireframe edges mapping indices
        edges = [
            (0,1), (1,2), (2,3), (3,0), # Back face
            (4,5), (5,6), (6,7), (7,4), # Front face
            (0,4), (1,5), (2,6), (3,7)  # Connection links
        ]

        # Draw cube faces with dynamic colorful glow simulation
        painter.setPen(QPen(QColor(0, 150, 255, 150), 3))
        for p1, p2 in edges:
            painter.drawLine(projected[p1][0], projected[p1][1], projected[p2][0], projected[p2][1])

        # Draw small target nodes for physical marker tracking
        painter.setBrush(QBrush(QColor(255, 140, 0)))
        for idx, (px, py) in enumerate(projected):
            painter.setPen(QPen(QColor(255, 255, 255), 1))
            painter.drawEllipse(px - 5, py - 5, 10, 10)

            # Label corners with numerical tags
            painter.setPen(QPen(QColor(200, 200, 200), 1))
            painter.drawText(px + 8, py + 5, f"P{idx}")

    def _draw_mesh_lines(self, painter, w, h):
        """
        Draws horizontal and vertical bezier/bilinear mesh grid connector ropes.
        """
        # Horizontal links
        painter.setPen(QPen(QColor(10, 200, 10, 120), 1))
        for r in range(self.mesh_rows + 1):
            for c in range(self.mesh_cols):
                p1 = self.mesh_nodes[r][c]
                p2 = self.mesh_nodes[r][c+1]
                painter.drawLine(int(p1[0]*w), int(p1[1]*h), int(p2[0]*w), int(p2[1]*h))

        # Vertical links
        for c in range(self.mesh_cols + 1):
            for r in range(self.mesh_rows):
                p1 = self.mesh_nodes[r][c]
                p2 = self.mesh_nodes[r+1][c]
                painter.drawLine(int(p1[0]*w), int(p1[1]*h), int(p2[0]*w), int(p2[1]*h))

        # Draw physical interactive nodes
        for r in range(self.mesh_rows + 1):
            for c in range(self.mesh_cols + 1):
                p = self.mesh_nodes[r][c]
                px, py = int(p[0]*w), int(p[1]*h)

                if self.selected_node == (r, c):
                    painter.setBrush(QBrush(QColor(201, 162, 39))) # Yellow active selection
                    painter.setPen(QPen(QColor(255, 255, 255), 2))
                    painter.drawEllipse(px - 7, py - 7, 14, 14)
                else:
                    painter.setBrush(QBrush(QColor(16, 124, 16))) # Green resting
                    painter.setPen(QPen(QColor(0, 0, 0), 1))
                    painter.drawEllipse(px - 5, py - 5, 10, 10)
