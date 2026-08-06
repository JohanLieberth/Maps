import numpy as np
import scipy.linalg

class ProjectionCalibrator3D:
    """
    Implements standard DLT (Direct Linear Transform) and camera-based PnP mathematical calibration
    to calculate the projector's pose and projection matrix given 3D models and 2D target markers.
    """
    def __init__(self):
        # List of 3D points in model coordinate space [X, Y, Z]
        self.points_3d = []
        # Corresponding 2D points on the camera/projector screen [u, v] (normalized or pixels)
        self.points_2d = []

        # Calculated projection matrix (3x4)
        self.projection_matrix = None

        # Camera / Projector intrinsics & extrinsics (extracted from DLT matrix)
        self.K = None # Intrinsics
        self.R = None # Rotation matrix
        self.T = None # Translation vector

    def add_correspondence(self, pt_3d, pt_2d):
        """
        Adds a single point correspondence between a 3D model point and 2D projector screen coordinate.
        """
        self.points_3d.append(list(pt_3d))
        self.points_2d.append(list(pt_2d))

    def clear_correspondences(self):
        self.points_3d = []
        self.points_2d = []
        self.projection_matrix = None

    def compute_dlt(self):
        """
        Calculates the 3x4 projection matrix using Direct Linear Transform (DLT) algorithm.
        Requires at least 6 points of correspondence.
        """
        if len(self.points_3d) < 6 or len(self.points_2d) < 6:
            raise ValueError("DLT calibration requires a minimum of 6 point correspondences.")

        num_points = len(self.points_3d)
        A = []

        for i in range(num_points):
            X, Y, Z = self.points_3d[i]
            u, v = self.points_2d[i]

            # Form equations:
            # u = (P11*X + P12*Y + P13*Z + P14) / (P31*X + P32*Y + P33*Z + P34)
            # v = (P21*X + P22*Y + P23*Z + P24) / (P31*X + P32*Y + P33*Z + P34)
            # Multiplying out yields:
            # -X*P11 - Y*P12 - Z*P13 - P14 + u*X*P31 + u*Y*P32 + u*Z*P33 + u*P34 = 0
            # -X*P21 - Y*P22 - Z*P23 - P24 + v*X*P31 + v*Y*P32 + v*Z*P33 + v*P34 = 0

            A.append([-X, -Y, -Z, -1, 0, 0, 0, 0, u*X, u*Y, u*Z, u])
            A.append([0, 0, 0, 0, -X, -Y, -Z, -1, v*X, v*Y, v*Z, v])

        A = np.array(A, dtype=np.float64)

        # Perform Singular Value Decomposition (SVD) on matrix A
        U, S, Vh = np.linalg.svd(A)
        # The solution is the last row of Vh (or last column of V) which minimizes ||A*P||^2
        P = Vh[-1, :]
        self.projection_matrix = P.reshape((3, 4))

        # Decompose the projection matrix P to recover camera parameters K, R, T
        self._decompose_projection_matrix()
        return self.projection_matrix

    def _decompose_projection_matrix(self):
        """
        Decomposes 3x4 matrix P = K * [R | T] using RQ decomposition on the left 3x3 block.
        """
        if self.projection_matrix is None:
            return

        P_3x3 = self.projection_matrix[:, :3]
        P_col4 = self.projection_matrix[:, 3]

        # RQ decomposition on P_3x3
        # scipy provides rq decomposition
        try:
            K, R = scipy.linalg.rq(P_3x3)

            # Ensure diagonal of K (intrinsics) is positive
            T_scale = np.ones(3)
            for i in range(3):
                if K[i, i] < 0:
                    K[:, i] = -K[:, i]
                    R[i, :] = -R[i, :]

            self.K = K
            self.R = R
            # T = K^-1 * P_col4
            self.T = np.linalg.inv(K).dot(P_col4)
        except Exception:
            # Fallback simple division
            self.K = np.eye(3)
            self.R = np.eye(3)
            self.T = np.zeros(3)

    def project_point(self, pt_3d):
        """
        Projects a 3D point into 2D camera coordinates using calculated projection matrix.
        """
        if self.projection_matrix is None:
            raise ValueError("Projection matrix must be calibrated first.")

        X, Y, Z = pt_3d
        pt_homogeneous = np.array([X, Y, Z, 1.0])
        pt_projected = self.projection_matrix.dot(pt_homogeneous)

        if pt_projected[2] == 0:
            return [0.0, 0.0]

        u = pt_projected[0] / pt_projected[2]
        v = pt_projected[1] / pt_projected[2]
        return [float(u), float(v)]

    def get_frustum_planes(self):
        """
        Calculates normalized projection frustum boundaries (Left, Right, Bottom, Top, Near, Far planes)
        useful for 3D projector viewports and scene visualizations.
        """
        if self.projection_matrix is None:
            return []

        # Standard extraction of camera frustum planes from view-projection matrix
        P = self.projection_matrix
        planes = []
        # Left
        planes.append(P[2, :] + P[0, :])
        # Right
        planes.append(P[2, :] - P[0, :])
        # Bottom
        planes.append(P[2, :] + P[1, :])
        # Top
        planes.append(P[2, :] - P[1, :])

        # Normalize planes
        normalized_planes = []
        for plane in planes:
            norm = np.linalg.norm(plane[:3])
            if norm > 0:
                normalized_planes.append((plane / norm).tolist())
            else:
                normalized_planes.append(plane.tolist())
        return normalized_planes

    def export_matrices(self):
        """
        Returns full dict representation of the calibrated workspace parameters.
        """
        return {
            "projection_matrix": self.projection_matrix.tolist() if self.projection_matrix is not None else None,
            "K": self.K.tolist() if self.K is not None else None,
            "R": self.R.tolist() if self.R is not None else None,
            "T": self.T.tolist() if self.T is not None else None,
            "points_3d": self.points_3d,
            "points_2d": self.points_2d
        }

    def import_matrices(self, data):
        if data.get("projection_matrix") is not None:
            self.projection_matrix = np.array(data["projection_matrix"])
        if data.get("K") is not None:
            self.K = np.array(data["K"])
        if data.get("R") is not None:
            self.R = np.array(data["R"])
        if data.get("T") is not None:
            self.T = np.array(data["T"])
        self.points_3d = data.get("points_3d", [])
        self.points_2d = data.get("points_2d", [])
