import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export interface R2File {
  key: string;
  size: number;
  lastModified: string;
  url: string;
}

/**
 * Upload a file to Cloudflare R2 and return the public URL.
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await r2Client.send(command);
  return getR2Url(key);
}

/**
 * Return the public URL for an R2 object.
 */
export function getR2Url(key: string): string {
  const base = R2_PUBLIC_URL.replace(/\/$/, '');
  return `${base}/${key}`;
}

/**
 * Delete an object from R2.
 */
export async function deleteFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  await r2Client.send(command);
}

/**
 * List objects in the R2 bucket, optionally filtered by prefix.
 * Returns up to 200 items per call; pass continuationToken for the next page.
 */
export async function listR2Files(
  prefix?: string,
  continuationToken?: string
): Promise<{ files: R2File[]; nextToken?: string; isTruncated: boolean }> {
  const command = new ListObjectsV2Command({
    Bucket: R2_BUCKET_NAME,
    Prefix: prefix ?? '',
    MaxKeys: 200,
    ContinuationToken: continuationToken,
  });

  const resp = await r2Client.send(command);
  const files: R2File[] = (resp.Contents ?? []).map((obj) => ({
    key: obj.Key!,
    size: obj.Size ?? 0,
    lastModified: obj.LastModified?.toISOString() ?? '',
    url: getR2Url(obj.Key!),
  }));

  return {
    files,
    nextToken: resp.NextContinuationToken,
    isTruncated: resp.IsTruncated ?? false,
  };
}

/**
 * Get metadata for a single R2 object (size, content type, last modified).
 */
export async function headR2File(key: string) {
  const command = new HeadObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key });
  return r2Client.send(command);
}
