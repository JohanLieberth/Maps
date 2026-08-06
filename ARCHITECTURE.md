# Architecture: Professional Video Mapping System in Python

This document details the modular, high-performance architecture developed for the Video Mapping (Projection Mapping) desktop application. The system is designed for professional multi-projector setups, interactive installations, and live stage performances.

## System Architecture Diagram

```
                              ┌──────────────────────────────────────────────────┐
                              │                    PyQt6 GUI                     │
                              │   - Dockable Layout (Dark Theme)                 │
                              │   - Main Control Window                          │
                              │   - Mesh / Mask Vector Canvas                    │
                              │   - Timeline & Live Cue Controllers              │
                              └────────┬─────────────────────────────────────────┘
                                       │
                                       ▼
                     ┌────────────────────────────────────┐
                     │          Project Manager           │◄───────┐
                     │ - Saves/loads JSON project config  │        │
                     │ - Infinite Undo/Redo Engine        │        │
                     └─────────────────┬──────────────────┘        │
                                       │                           │
                                       ▼                           │
                     ┌────────────────────────────────────┐        │
                     │        Extended Virtual Canvas     │        │
                     │ - Compiles dynamic, multi-layer    │        │
                     │   rendering output (60 FPS+)       │        │
                     └─────────────────┬──────────────────┘        │
                                       │                           │
         ┌─────────────────────────────┼───────────────────────────┼──────────────────────────────┐
         ▼                             ▼                           ▼                              ▼
┌──────────────────┐          ┌──────────────────┐       ┌──────────────────┐          ┌──────────────────┐
│ Calibration      │          │ Rendering        │       │ Real-Time Control│          │ Color Adjustment │
│ & Geometry       │          │ & Codecs         │       │ & Sychronization │          │ & Projection     │
├──────────────────┤          ├──────────────────┤       ├──────────────────┤          ├──────────────────┤
│ - Mesh Warping   │          │ - Display Mgr    │       │ - Timeline &     │          │ - Color Control  │
│   (Grid 4x4-16)  │          │   (Multi-GPU)    │       │   Tracks / Cues  │          │   (Gamma, LUTs)  │
│ - Edge Blending  │          │ - Codecs Engine  │       │ - Input/Output   │          │ - Surface        │
│   (Gamma Blend)  │          │   (HAP, ProRes)  │       │   OSC, MIDI, Art-│          │   Compensation   │
│ - Vector Masking │          │ - Frame Cache    │       │   Net, LTC       │          │ - Black Level    │
│   (Bezier/Poly)  │          │ - IP Video (NDI, │       │ - Generative     │          │   Offset         │
│ - 3D Camera DLT  │          │   Spout/Syphon)  │       │   Particles, GLSL│          │                  │
└──────────────────┘          └──────────────────┘       └──────────────────┘          └──────────────────┘
```

## Module Definitions

### 1. `videomapping.core`
- **`project.py`**: Handles persistence, saving and loading of layout configurations, meshes, masks, calibration targets, outputs, and color parameters to structured JSON.
- **`undo_redo.py`**: State pattern implementation providing robust, unlimited stack undo/redo operations across all workspace settings.

### 2. `videomapping.calibration`
- **`mesh_warping.py`**: Encapsulates 2D perspective and bilinear mesh grids (with adjustable 4x4, 8x8, 16x16 nodes) to warp textures onto complex physical surfaces.
- **`edge_blending.py`**: Implements a horizontal/vertical gamma-smoothed edge blending algorithm to blend overlaps between multiple adjacent projector outputs.
- **`masking.py`**: Provides polygon, ellipse, and Bezier curve vector mask mathematical data structures. Supports additive, subtractive, and intersection masks.
- **`calibration_3d.py`**: Contains Direct Linear Transform (DLT) and Perspective-n-Point algorithms to calculate projector lens poses and generate projection matrices from 3D models (OBJ/FBX/glTF) onto real physical surfaces using at least 6 correspondence points.

### 3. `videomapping.rendering`
- **`display_manager.py`**: Detects OS-connected display screens dynamically and spawns dedicated, borderless full-screen outputs to target GPUs.
- **`canvas.py`**: Represents the unified wide virtual render space.
- **`video_decoder.py`**: High-performance video frames caching and decoding architecture to achieve stutter-free 60FPS+ performance for high resolution files (including HAP, DXV, and standard formats).
- **`protocols.py`**: Manages low-latency real-time video IP pipelines via NDI (Network Device Interface) and shared memory textures (Spout on Windows / Syphon on macOS).

### 4. `videomapping.control`
- **`timeline.py`**: Tracks multi-track keyframe automation, show playbacks (loops, bounces, cue sheets) and live-trigger slots.
- **`protocols.py`**: Listens and transmits real-time messages via OSC, MIDI, Art-Net/DMX UDP packets, and SMPTE LTC timecodes.
- **`generative.py`**: Houses real-time custom 2D/3D GLSL shaders, a high-performance particle engine, audio-reactive FFT frequency analysis, and mathematical generators (Perlin noise, sinusoids).

### 5. `videomapping.color`
- **`color_corrector.py`**: Adjusts per-output RGB gamma, exposure, contrast, saturation, and processes 1D & 3D color Look-Up Tables (LUTs).
- **`surface_compensation.py`**: Neutralizes underlying physical surfaces (e.g., brick, concrete, wood) by applying reverse-chromatic multiplication algorithms.
- **`black_level.py`**: Minimizes visible projection leakage in dark areas via configurable black-level offsets and non-linear attenuation curves.
