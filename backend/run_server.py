#!/usr/bin/env python3
"""
Standalone server runner for PyInstaller bundled backend
"""
import sys
import os

# Add the bundled app to the path
if getattr(sys, 'frozen', False):
    # Running in PyInstaller bundle
    bundle_dir = sys._MEIPASS
    sys.path.insert(0, bundle_dir)
else:
    # Running in normal Python environment
    bundle_dir = os.path.dirname(os.path.abspath(__file__))

# Change to the bundle directory
os.chdir(bundle_dir)

if __name__ == "__main__":
    import uvicorn

    # Run the FastAPI app
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
