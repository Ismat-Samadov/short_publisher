"""
upload_r2.py
Uploads files to Cloudflare R2 using boto3.
"""

import os
from pathlib import Path

import boto3
from botocore.config import Config


def _get_r2_client():
    """Create and return a boto3 S3 client configured for Cloudflare R2."""
    account_id = os.environ["R2_ACCOUNT_ID"]
    access_key = os.environ["R2_ACCESS_KEY_ID"]
    secret_key = os.environ["R2_SECRET_ACCESS_KEY"]

    return boto3.client(
        "s3",
        endpoint_url=f"https://{account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name="auto",
        config=Config(
            retries={"max_attempts": 3, "mode": "adaptive"},
            signature_version="s3v4",
        ),
    )


def upload_file_to_r2(file_path: str, key: str, content_type: str) -> str:
    """
    Upload a local file to Cloudflare R2.

    Args:
        file_path: Local path to the file
        key: R2 object key (e.g. 'videos/2024/video.mp4')
        content_type: MIME type (e.g. 'video/mp4', 'image/jpeg')

    Returns:
        Public URL of the uploaded file
    """
    if not Path(file_path).exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    bucket_name = os.environ["R2_BUCKET_NAME"]
    public_url = os.environ["R2_PUBLIC_URL"].rstrip("/")

    file_size = Path(file_path).stat().st_size
    print(f"[upload_r2] Uploading {key} ({file_size / (1024*1024):.1f} MB)...")

    client = _get_r2_client()

    with open(file_path, "rb") as f:
        client.upload_fileobj(
            f,
            bucket_name,
            key,
            ExtraArgs={
                "ContentType": content_type,
                "CacheControl": "public, max-age=31536000",
            },
        )

    url = f"{public_url}/{key}"
    print(f"[upload_r2] Uploaded: {url}")
    return url


def delete_from_r2(key: str) -> None:
    """Delete an object from R2."""
    bucket_name = os.environ["R2_BUCKET_NAME"]
    client = _get_r2_client()
    client.delete_object(Bucket=bucket_name, Key=key)
    print(f"[upload_r2] Deleted: {key}")
