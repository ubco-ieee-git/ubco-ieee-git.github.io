"""Serve the site and generate the event feed for local preview."""

import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from io import BytesIO
import json
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parent
EVENTS = ROOT / "_data" / "events"


class PreviewHandler(SimpleHTTPRequestHandler):
    def send_head(self):
        if urlsplit(self.path).path != "/events/feed.json":
            return super().send_head()

        records = []
        for path in sorted(EVENTS.glob("*/*.json")):
            try:
                records.append(json.loads(path.read_text(encoding="utf-8")))
            except (OSError, ValueError) as error:
                self.log_error("Could not load %s: %s", path.name, error)
                self.send_error(500, "Could not load event data. See the preview terminal.")
                return None

        body = json.dumps(records, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        return BytesIO(body)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()

    handler = partial(PreviewHandler, directory=ROOT)
    with ThreadingHTTPServer(("127.0.0.1", args.port), handler) as server:
        print(f"Preview at http://127.0.0.1:{server.server_port}/", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
