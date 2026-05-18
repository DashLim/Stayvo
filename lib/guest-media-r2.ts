import 'server-only';

import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

let client: S3Client | null = null;

/**
 * R2 (S3-compatible) for guest/property media blobs. Configure:
 *
 * R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
 *
 * Public URLs for the browser use NEXT_PUBLIC_GUEST_MEDIA_URL in
 * `lib/guest-property-media.ts` (R2 public bucket domain or custom domain, no trailing slash).
 */
export function isGuestMediaR2Enabled(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID?.trim() &&
      process.env.R2_ACCESS_KEY_ID?.trim() &&
      process.env.R2_SECRET_ACCESS_KEY?.trim() &&
      process.env.R2_BUCKET_NAME?.trim()
  );
}

function getClient(): S3Client {
  if (client) return client;
  const accountId = process.env.R2_ACCOUNT_ID!.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID!.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!.trim();
  client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return client;
}

function getBucket(): string {
  return process.env.R2_BUCKET_NAME!.trim();
}

/** Browser uploads large videos directly to R2 (bypasses Server Action body limits on Vercel). */
export async function r2PresignedPutGuestMedia(
  key: string,
  contentType: string,
  expiresInSeconds = 600
): Promise<{ ok: true; uploadUrl: string } | { ok: false; error: string }> {
  if (!isGuestMediaR2Enabled()) {
    return { ok: false, error: 'Direct upload is not configured.' };
  }
  try {
    const uploadUrl = await getSignedUrl(
      // Presigner types can lag @aws-sdk/client-s3 minor versions; runtime client is compatible.
      getClient() as unknown as Parameters<typeof getSignedUrl>[0],
      new PutObjectCommand({
        Bucket: getBucket(),
        Key: key,
        ContentType: contentType,
        CacheControl: 'max-age=31536000',
      }),
      { expiresIn: expiresInSeconds }
    );
    return { ok: true, uploadUrl };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

export async function r2PutGuestMedia(
  key: string,
  body: Buffer,
  contentType: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await getClient().send(
      new PutObjectCommand({
        Bucket: getBucket(),
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: 'max-age=31536000',
      })
    );
    return { ok: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

export async function r2DeleteGuestMedia(
  key: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await getClient().send(
      new DeleteObjectCommand({
        Bucket: getBucket(),
        Key: key,
      })
    );
    return { ok: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

export async function r2GetGuestMediaBuffer(key: string): Promise<Buffer> {
  const res = await getClient().send(
    new GetObjectCommand({
      Bucket: getBucket(),
      Key: key,
    })
  );
  if (!res.Body) {
    throw new Error('Object not found in storage.');
  }
  const bytes = await res.Body.transformToByteArray();
  return Buffer.from(bytes);
}

export async function r2GuestMediaExists(key: string): Promise<boolean> {
  try {
    await getClient().send(
      new HeadObjectCommand({
        Bucket: getBucket(),
        Key: key,
      })
    );
    return true;
  } catch {
    return false;
  }
}

/** Delete all objects whose key starts with `prefix` (e.g. userId/propertyId/). */
export async function r2DeleteKeysWithPrefix(prefix: string): Promise<void> {
  const normalized = prefix.endsWith('/') ? prefix : `${prefix}/`;
  const s3 = getClient();
  const bucket = getBucket();
  let continuationToken: string | undefined;

  do {
    const list = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: normalized,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      })
    );

    const keys = (list.Contents ?? [])
      .map((o) => o.Key)
      .filter((k): k is string => Boolean(k));

    if (keys.length > 0) {
      await s3.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: {
            Objects: keys.map((Key) => ({ Key })),
            Quiet: true,
          },
        })
      );
    }

    continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
  } while (continuationToken);
}
