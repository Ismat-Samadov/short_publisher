"""
get_youtube_token.py
Obtain a YouTube OAuth2 refresh token using a local redirect server.
Reads credentials from .env.local automatically.
"""

import os
import sys
import json
import webbrowser
import urllib.parse
import urllib.request
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path


SCOPES = " ".join([
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly",
])
REDIRECT_PORT = 8080
REDIRECT_URI = f"http://localhost:{REDIRECT_PORT}"


def _load_env():
    env_file = Path(__file__).parent.parent / ".env.local"
    if not env_file.exists():
        return
    for line in env_file.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip())


_load_env()

# Shared state for the callback handler
_auth_code: dict = {"value": None}


class _CallbackHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)

        if "code" in params:
            _auth_code["value"] = params["code"][0]
            body = b"<h2>Authorization successful! You can close this tab.</h2>"
            self.send_response(200)
        elif "error" in params:
            _auth_code["value"] = None
            body = f"<h2>Error: {params['error'][0]}</h2>".encode()
            self.send_response(400)
        else:
            body = b"<h2>Waiting...</h2>"
            self.send_response(200)

        self.send_header("Content-Type", "text/html")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass  # silence request logs


def main():
    client_id = os.environ.get("YOUTUBE_CLIENT_ID")
    client_secret = os.environ.get("YOUTUBE_CLIENT_SECRET")

    if not client_id or not client_secret:
        print("ERROR: YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET not found.")
        print("Make sure they are set in .env.local")
        sys.exit(1)

    # Build the authorization URL
    auth_url = "https://accounts.google.com/o/oauth2/v2/auth?" + urllib.parse.urlencode({
        "client_id": client_id,
        "redirect_uri": REDIRECT_URI,
        "response_type": "code",
        "scope": SCOPES,
        "access_type": "offline",
        "prompt": "consent",
    })

    print("=" * 60)
    print("YouTube OAuth2 Token Generator")
    print("=" * 60)
    print()
    print(f"Opening browser... (listening on {REDIRECT_URI})")
    print("Authorize the app in the browser, then return here.")
    print()

    webbrowser.open(auth_url)

    # Start local server and wait for the redirect with the auth code
    server = HTTPServer(("localhost", REDIRECT_PORT), _CallbackHandler)
    server.handle_request()  # handles exactly one request then stops

    code = _auth_code["value"]
    if not code:
        print("ERROR: No authorization code received. Try again.")
        sys.exit(1)

    # Exchange auth code for tokens
    token_data = urllib.parse.urlencode({
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": REDIRECT_URI,
        "grant_type": "authorization_code",
    }).encode()

    req = urllib.request.Request(
        "https://oauth2.googleapis.com/token",
        data=token_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req) as resp:
            tokens = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"ERROR: Token exchange failed: {error_body}")
        sys.exit(1)

    refresh_token = tokens.get("refresh_token")

    if not refresh_token:
        print("ERROR: No refresh token returned. Revoke the app at")
        print("https://myaccount.google.com/permissions then run again.")
        sys.exit(1)

    # Write directly into .env.local
    env_path = Path(__file__).parent.parent / ".env.local"
    content = env_path.read_text()

    if "YOUTUBE_REFRESH_TOKEN=" in content:
        lines = content.splitlines()
        new_lines = []
        for line in lines:
            if line.startswith("YOUTUBE_REFRESH_TOKEN="):
                new_lines.append(f"YOUTUBE_REFRESH_TOKEN={refresh_token}")
            else:
                new_lines.append(line)
        env_path.write_text("\n".join(new_lines) + "\n")
    else:
        with open(env_path, "a") as f:
            f.write(f"\nYOUTUBE_REFRESH_TOKEN={refresh_token}\n")

    print()
    print("Done! YOUTUBE_REFRESH_TOKEN written to .env.local")


if __name__ == "__main__":
    main()
