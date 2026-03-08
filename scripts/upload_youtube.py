"""
upload_youtube.py
Uploads a video to YouTube using the YouTube Data API v3 with OAuth2 refresh token flow.
"""

import os
import time
from pathlib import Path

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from googleapiclient.errors import HttpError

# YouTube API settings
YOUTUBE_API_SERVICE_NAME = "youtube"
YOUTUBE_API_VERSION = "v3"
YOUTUBE_CATEGORY_SCIENCE_TECH = "28"
YOUTUBE_CATEGORY_PEOPLE_BLOGS = "22"

# Retry settings
MAX_RETRIES = 3
RETRY_DELAY = 5


def upload_to_youtube(
    video_path: str,
    title: str,
    description: str,
    hashtags: list[str],
    category_id: str = YOUTUBE_CATEGORY_SCIENCE_TECH,
    privacy_status: str = "public",
) -> str:
    """
    Upload a video to YouTube and return the video ID.

    Args:
        video_path: Path to the MP4 file
        title: Video title (max 100 chars)
        description: Video description
        hashtags: List of hashtag strings (without '#')
        category_id: YouTube category ID
        privacy_status: 'public', 'unlisted', or 'private'

    Returns:
        YouTube video ID (e.g. 'dQw4w9WgXcQ')
    """
    if not Path(video_path).exists():
        raise FileNotFoundError(f"Video file not found: {video_path}")

    credentials = _get_credentials()
    youtube = build(
        YOUTUBE_API_SERVICE_NAME,
        YOUTUBE_API_VERSION,
        credentials=credentials,
        cache_discovery=False,
    )

    # Format hashtags for YouTube (include in description)
    hashtag_str = " ".join(f"#{tag}" for tag in hashtags)
    full_description = f"{description}\n\n{hashtag_str}"

    # Truncate title if needed
    if len(title) > 100:
        title = title[:97] + "..."

    body = {
        "snippet": {
            "title": title,
            "description": full_description,
            "tags": hashtags,
            "categoryId": category_id,
            "defaultLanguage": "en",
        },
        "status": {
            "privacyStatus": privacy_status,
            "selfDeclaredMadeForKids": False,
        },
    }

    file_size = Path(video_path).stat().st_size
    print(f"[upload_youtube] Uploading: {title}")
    print(f"[upload_youtube] File size: {file_size / (1024*1024):.1f} MB")
    print(f"[upload_youtube] Privacy: {privacy_status}")

    media = MediaFileUpload(
        video_path,
        mimetype="video/mp4",
        resumable=True,
        chunksize=5 * 1024 * 1024,  # 5 MB chunks
    )

    request = youtube.videos().insert(
        part=",".join(body.keys()),
        body=body,
        media_body=media,
    )

    video_id = _resumable_upload(request)
    video_url = f"https://www.youtube.com/shorts/{video_id}"
    print(f"[upload_youtube] Upload complete: {video_url}")

    return video_id


def _get_credentials() -> Credentials:
    """Build OAuth2 credentials from environment variables."""
    client_id = os.environ["YOUTUBE_CLIENT_ID"]
    client_secret = os.environ["YOUTUBE_CLIENT_SECRET"]
    refresh_token = os.environ["YOUTUBE_REFRESH_TOKEN"]

    return Credentials(
        token=None,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=client_id,
        client_secret=client_secret,
        scopes=["https://www.googleapis.com/auth/youtube.upload"],
    )


def _resumable_upload(request) -> str:
    """Execute a resumable upload with retry logic. Returns video ID."""
    response = None
    error = None
    retry = 0

    while response is None:
        try:
            print(f"[upload_youtube] Uploading chunk... (attempt {retry + 1})")
            status, response = request.next_chunk()

            if status:
                progress = int(status.progress() * 100)
                print(f"[upload_youtube] Upload progress: {progress}%")

        except HttpError as e:
            if e.resp.status in (500, 502, 503, 504):
                error = e
                retry += 1
                if retry > MAX_RETRIES:
                    raise RuntimeError(f"Upload failed after {MAX_RETRIES} retries: {e}")
                print(f"[upload_youtube] Transient error, retrying in {RETRY_DELAY}s...")
                time.sleep(RETRY_DELAY * retry)
            else:
                raise RuntimeError(f"YouTube API error: {e}")

        except Exception as e:
            error = e
            retry += 1
            if retry > MAX_RETRIES:
                raise RuntimeError(f"Upload failed after {MAX_RETRIES} retries: {e}")
            print(f"[upload_youtube] Error, retrying in {RETRY_DELAY}s: {e}")
            time.sleep(RETRY_DELAY * retry)

    if "id" not in response:
        raise RuntimeError(f"Unexpected upload response: {response}")

    return response["id"]
