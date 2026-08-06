import sys
from PyQt6.QtWidgets import QApplication
from videomapping.gui.main_window import MainWindow

def main():
    """
    Main entrypoint launching the professional Desktop Projection Mapping application workspace.
    """
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec())

if __name__ == "__main__":
    main()
