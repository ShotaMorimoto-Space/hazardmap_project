#!/usr/bin/env python3
"""Validation用の簡易静的ファイルサーバ（HTTP Range対応）。"""

from __future__ import annotations

import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class RangeRequestHandler(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def do_GET(self) -> None:  # noqa: N802
        path = self.translate_path(self.path)
        file_path = Path(path)
        if not file_path.is_file():
            self.send_error(404, "File not found")
            return

        file_size = file_path.stat().st_size
        range_header = self.headers.get("Range")
        content_type = self.guess_type(str(file_path))

        if range_header and range_header.startswith("bytes="):
            unit, _, spec = range_header.partition("=")
            if unit != "bytes" or "," in spec:
                self.send_error(400, "Invalid Range")
                return
            start_s, _, end_s = spec.partition("-")
            try:
                start = int(start_s) if start_s else 0
                end = int(end_s) if end_s else file_size - 1
            except ValueError:
                self.send_error(400, "Invalid Range")
                return
            if start >= file_size or end < start:
                self.send_error(416, "Requested Range Not Satisfiable")
                return
            end = min(end, file_size - 1)
            length = end - start + 1
            self.send_response(206)
            self.send_header("Content-Type", content_type)
            self.send_header("Accept-Ranges", "bytes")
            self.send_header("Content-Range", f"bytes {start}-{end}/{file_size}")
            self.send_header("Content-Length", str(length))
            self.send_header("Connection", "close")
            self.end_headers()
            with file_path.open("rb") as handle:
                handle.seek(start)
                remaining = length
                while remaining:
                    chunk = handle.read(min(64 * 1024, remaining))
                    if not chunk:
                        break
                    self.wfile.write(chunk)
                    remaining -= len(chunk)
            return

        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Length", str(file_size))
        self.send_header("Connection", "close")
        self.end_headers()
        with file_path.open("rb") as handle:
            while True:
                chunk = handle.read(64 * 1024)
                if not chunk:
                    break
                self.wfile.write(chunk)

    def log_message(self, format: str, *args) -> None:  # noqa: A003
        print("[%s] %s" % (self.log_date_time_string(), format % args))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8080)
    parser.add_argument("--directory", default=".")
    args = parser.parse_args()
    handler = RangeRequestHandler
    handler.directory = args.directory
    server = ThreadingHTTPServer(("127.0.0.1", args.port), handler)
    print(f"serving {Path(args.directory).resolve()} on http://127.0.0.1:{args.port}")
    print("validation page: /validation/pmtiles-map.html")
    server.serve_forever()


if __name__ == "__main__":
    main()
