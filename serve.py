"""Static dev server for site/ (no-cache, multi-threaded so video streaming
doesn't block page requests). Honors the PORT env var (falls back to 5173)."""
import http.server, os
from http.server import ThreadingHTTPServer

os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), "site"))

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

PORT = int(os.environ.get("PORT", "5173"))
with ThreadingHTTPServer(("", PORT), NoCacheHandler) as httpd:
    httpd.daemon_threads = True
    print(f"serving site/ on http://localhost:{PORT} (no-cache, threaded)")
    httpd.serve_forever()
