"""
Minimal web server for the Two-Stack Expression Evaluator visualizer.

Serves the existing HTML UI and exposes JSON APIs that call the Python
two-stack evaluator (no eval(), no third-party expression libraries).

Run from this directory:
    python3 app.py
Then open http://127.0.0.1:5050/
"""

from __future__ import annotations

import json
import mimetypes
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

from evaluator import ExpressionError, evaluate_expression, evaluate_trace

ROOT = Path(__file__).resolve().parent
HTML_FILE = ROOT / "two_stack_expression_visualizer_unary.html"
HOST = "127.0.0.1"
PORT = 5050  # avoid macOS AirPlay often bound to 5000


class Handler(BaseHTTPRequestHandler):
    server_version = "TwoStackEvaluator/1.0"

    def log_message(self, fmt: str, *args) -> None:
        print(f"[{self.log_date_time_string()}] {self.address_string()} {fmt % args}")

    def _send_json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _send_file(self, path: Path) -> None:
        if not path.is_file():
            self.send_error(404, "File not found")
            return
        data = path.read_bytes()
        ctype, _ = mimetypes.guess_type(str(path))
        self.send_response(200)
        self.send_header("Content-Type", ctype or "application/octet-stream")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _read_json(self) -> dict:
        length = int(self.headers.get("Content-Length", "0") or 0)
        raw = self.rfile.read(length) if length else b"{}"
        try:
            data = json.loads(raw.decode("utf-8") or "{}")
        except json.JSONDecodeError as exc:
            raise ExpressionError("Invalid JSON body") from exc
        if not isinstance(data, dict):
            raise ExpressionError("Request body must be a JSON object")
        return data

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path in ("/", "/index.html"):
            self._send_file(HTML_FILE)
            return
        # Allow opening the original filename directly
        if path.lstrip("/") == HTML_FILE.name:
            self._send_file(HTML_FILE)
            return
        self.send_error(404, "Not found")

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        try:
            data = self._read_json()
            expression = data.get("expression", "")
            if not isinstance(expression, str):
                raise ExpressionError("Field 'expression' must be a string")

            if path == "/api/evaluate":
                result = evaluate_expression(expression)
                self._send_json(200, {"ok": True, "result": result})
                return

            if path == "/api/trace":
                trace = evaluate_trace(expression)
                self._send_json(200, {"ok": True, **trace})
                return

            self._send_json(404, {"ok": False, "error": "Unknown endpoint"})
        except ExpressionError as exc:
            self._send_json(400, {"ok": False, "error": str(exc)})
        except Exception as exc:  # noqa: BLE001 — surface as API error
            self._send_json(500, {"ok": False, "error": f"Server error: {exc}"})


def main() -> None:
    if not HTML_FILE.is_file():
        raise SystemExit(f"Missing HTML file: {HTML_FILE}")
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"Two-Stack Expression Evaluator", flush=True)
    print(f"Open http://{HOST}:{PORT}/", flush=True)
    print("Press Ctrl+C to stop.", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down.")
        server.server_close()


if __name__ == "__main__":
    main()
