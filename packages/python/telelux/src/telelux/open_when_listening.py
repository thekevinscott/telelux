import socket
import time
import webbrowser


def open_when_listening(host: str, port: int) -> None:
    while True:
        try:
            socket.create_connection((host, port), timeout=1).close()
        except OSError:
            time.sleep(0.05)
        else:
            webbrowser.open(f"http://{host}:{port}/")
            return
