import numpy as np

class MeshWarpLayer:
    """
    Manages an individual mesh warping layer with configurable grid resolution
    (e.g., 4x4, 8x8, 16x16) and editable nodes.
    """
    def __init__(self, name="Layer 1", cols=4, rows=4):
        self.name = name
        self.cols = cols
        self.rows = rows
        self.nodes = [] # List of list of [x, y] coordinates from 0.0 to 1.0 (normalized)
        self.reset_mesh()

    def reset_mesh(self):
        """
        Resets the mesh nodes to a perfect uniform grid.
        """
        self.nodes = []
        for r in range(self.rows + 1):
            row_nodes = []
            y = r / self.rows
            for c in range(self.cols + 1):
                x = c / self.cols
                row_nodes.append([x, y])
            self.nodes.append(row_nodes)

    def change_resolution(self, cols, rows):
        """
        Re-samples or resets the mesh to a new resolution.
        """
        self.cols = cols
        self.rows = rows
        self.reset_mesh()

    def update_node(self, col, row, nx, ny):
        """
        Updates the coordinate of a specific mesh point.
        """
        if 0 <= row <= self.rows and 0 <= col <= self.cols:
            self.nodes[row][col] = [float(nx), float(ny)]

    def to_dict(self):
        return {
            "name": self.name,
            "cols": self.cols,
            "rows": self.rows,
            "nodes": self.nodes
        }

    def from_dict(self, data):
        self.name = data.get("name", self.name)
        self.cols = data.get("cols", self.cols)
        self.rows = data.get("rows", self.rows)
        self.nodes = data.get("nodes", self.nodes)

    def evaluate_bilinear(self, u, v):
        """
        Given normalized coordinates (u, v) from 0.0 to 1.0, calculates the warped
        mapped point (x, y) utilizing bilinear interpolation over the target grid cell.
        """
        # Clamp coordinates
        u = max(0.0, min(1.0, u))
        v = max(0.0, min(1.0, v))

        # Determine cell index
        cell_u = u * self.cols
        cell_v = v * self.rows

        col = int(cell_u)
        row = int(cell_v)

        # Clamp cell indexes
        col = min(col, self.cols - 1)
        row = min(row, self.rows - 1)

        # Local interpolation parameters within the cell
        tu = cell_u - col
        tv = cell_v - row

        # Get coordinates of the 4 cell corner nodes
        p00 = np.array(self.nodes[row][col])
        p10 = np.array(self.nodes[row][col + 1])
        p01 = np.array(self.nodes[row + 1][col])
        p11 = np.array(self.nodes[row + 1][col + 1])

        # Bilinear interpolation equation
        lerp_bottom = p00 * (1.0 - tu) + p10 * tu
        lerp_top = p01 * (1.0 - tu) + p11 * tu

        warped_pt = lerp_bottom * (1.0 - tv) + lerp_top * tv
        return warped_pt.tolist()
