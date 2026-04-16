import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSecret } from './secrets';

export interface R2File {
  key: string;
  size: number;
  lastModified: string;
  url: string;
}

/** Build an S3Client using secrets (env → DB fallback). */
async function getClient() {
  const accountId   = await getSecret('R2_ACCOUNT_ID');
  const accessKeyId = await getSecret('R2_ACCESS_KEY_ID');
  const secretKey   = await getSecret('R2_SECRET_ACCESS_KEY');

  if (!accountId || !accessKeyId || !secretKey) {
    throw new Error('R2 credentials not configured. Add R2_ACCOUNT_ID, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY in Dashboard → Secrets.');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey: secretKey },
  });
}

async function getBucket() {
  const bucket = await getSecret('R2_BUCKET_NAME');
  if (!bucket) throw new Error('R2_BUCKET_NAME not configured.');
  return bucket;
}

/**
 * Return the public URL for an R2 object.
 * Reads R2_PUBLIC_URL from env or DB.
 */
export async function getR2Url(key: string): Promise<string> {
  const base = (await getSecret('R2_PUBLIC_URL')).replace(/\/$/, '');
  return `${base}/${key}`;
}

/**
 * Sync version for callers that already have the public URL base in env
 * (kept for backwards-compatibility with pipeline-side code).
 */
export function getR2UrlSync(key: string): string {
  const base = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '');
  return `${base}/${key}`;
}

/**
 * Upload a file to Cloudflare R2 and return the public URL.
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  const [client, bucket] = await Promise.all([getClient(), getBucket()]);
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }));
  return getR2Url(key);
}

/**
 * Delete an object from R2.
 */
export async function deleteFromR2(key: string): Promise<void> {
  const [client, bucket] = await Promise.all([getClient(), getBucket()]);
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

/**
 * List objects in the R2 bucket, optionally filtered by prefix.
 * Returns up to 200 items per call; pass continuationToken for the next page.
 */
export async function listR2Files(
  prefix?: string,
  continuationToken?: string
): Promise<{ files: R2File[]; nextToken?: string; isTruncated: boolean }> {
  const [client, bucket, publicUrl] = await Promise.all([
    getClient(),
    getBucket(),
    getSecret('R2_PUBLIC_URL'),
  ]);
  const base = publicUrl.replace(/\/$/, '');

  const resp = await client.send(new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: prefix ?? '',
    MaxKeys: 200,
    ContinuationToken: continuationToken,
  }));

  const files: R2File[] = (resp.Contents ?? []).map((obj) => ({
    key: obj.Key!,
    size: obj.Size ?? 0,
    lastModified: obj.LastModified?.toISOString() ?? '',
    url: `${base}/${obj.Key!}`,
  }));

  return { files, nextToken: resp.NextContinuationToken, isTruncated: resp.IsTruncated ?? false };
}

/**
 * Get metadata for a single R2 object.
 */
export async function headR2File(key: string) {
  const [client, bucket] = await Promise.all([getClient(), getBucket()]);
  return client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
}
