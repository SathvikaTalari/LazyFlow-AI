import os
import sys
import socket
from pathlib import Path

# Fix Windows console UTF-8 output if possible
if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

def is_port_in_use(host: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex((host, port)) == 0

if __name__ == "__main__":
    import uvicorn
    from app.config import HOST, PORT

    if is_port_in_use(HOST, PORT):
        print(f"\n[!] WARNING: Port {PORT} is already in use on {HOST}!")
        print(f"[!] Another instance of the LazyFlow AI backend is already running.")
        print(f"[!] You can access the API at http://{HOST}:{PORT}")
        print(f"[!] To restart it, stop the existing process holding port {PORT}.\n")
        sys.exit(0)

    print("============================================================")
    print(f"[LazyFlow AI] Starting Backend Server on http://{HOST}:{PORT}")
    print(f"[LazyFlow AI] Swagger Docs available at http://{HOST}:{PORT}/docs")
    print("============================================================")
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=True)
