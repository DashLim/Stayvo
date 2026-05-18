import 'server-only';

import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { SupabaseClient } from '@supabase/supabase-js';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

import {
  buildDedupStoragePath,
  isIncomingStoragePath,
} from '@/lib/guest-media-upload-api';
import {
  isGuestMediaR2Enabled,
  r2DeleteGuestMedia,
  r2GetGuestMediaBuffer,
  r2GuestMediaExists,
  r2PutGuestMedia,
} from '@/lib/guest-media-r2';
import { GUEST_VIDEO_MAX_BYTES } from '@/lib/guest-property-media';

const OUTPUT_MIME = 'video/mp4';

function sha256Hex(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

function transcodeFileToMp4(inputPath: string, outputPath: string): Promise<void> {
  const binary = ffmpegPath;
  if (!binary) {
    return Promise.reject(new Error('FFmpeg binary is not available on this server.'));
  }

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .setFfmpegPath(binary)
      .outputOptions([
        '-vf',
        "scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease",
        '-c:v',
        'libx264',
        '-crf',
        '30',
        '-preset',
        'veryfast',
        '-maxrate',
        '2M',
        '-bufsize',
        '4M',
        '-c:a',
        'aac',
        '-b:a',
        '96k',
        '-movflags',
        '+faststart',
      ])
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
}

export async function transcodeVideoBuffer(
  input: Buffer
): Promise<{ ok: true; buffer: Buffer } | { ok: false; error: string }> {
  if (!ffmpegPath) {
    return { ok: false, error: 'FFmpeg binary is not available on this server.' };
  }

  const workDir = await mkdtemp(join(tmpdir(), 'stayvo-vid-'));
  const inputFile = join(workDir, 'input.bin');
  const outputFile = join(workDir, 'output.mp4');

  try {
    await writeFile(inputFile, input);
    await transcodeFileToMp4(inputFile, outputFile);
    const compressed = await readFile(outputFile);
    if (compressed.length > GUEST_VIDEO_MAX_BYTES) {
      return {
        ok: false,
        error:
          'Video is still too large after compression. Try a shorter clip, then upload again.',
      };
    }
    return { ok: true, buffer: compressed };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Stayvo] buffer video transcode failed:', msg);
    return { ok: false, error: 'Could not compress video on the server.' };
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}

export type TranscodeGuestVideoResult =
  | {
      ok: true;
      path: string;
      byteSize: number;
      contentSha256: string;
      reused: boolean;
    }
  | { ok: false; error: string };

/**
 * Download a staged incoming video from R2, transcode to MP4, dedupe, and register in host_media_assets.
 */
export async function transcodeGuestVideoFromIncoming(
  supabase: SupabaseClient,
  userId: string,
  incomingPath: string
): Promise<TranscodeGuestVideoResult> {
  if (!isGuestMediaR2Enabled()) {
    return { ok: false, error: 'Video compression requires R2 storage.' };
  }

  const trimmed = incomingPath.trim();
  if (!isIncomingStoragePath(userId, trimmed)) {
    return { ok: false, error: 'Invalid incoming storage path.' };
  }

  if (!(await r2GuestMediaExists(trimmed))) {
    return { ok: false, error: 'Upload not found. Try uploading again.' };
  }

  const workDir = await mkdtemp(join(tmpdir(), 'stayvo-vid-'));
  const inputFile = join(workDir, 'input');
  const outputFile = join(workDir, 'output.mp4');

  try {
    const raw = await r2GetGuestMediaBuffer(trimmed);
    await writeFile(inputFile, raw);

    await transcodeFileToMp4(inputFile, outputFile);

    const compressed = await readFile(outputFile);
    if (compressed.length > GUEST_VIDEO_MAX_BYTES) {
      return {
        ok: false,
        error:
          'Video is still too large after compression. Try a shorter clip, then upload again.',
      };
    }

    const contentSha256 = sha256Hex(compressed);
    const finalPath = buildDedupStoragePath(userId, OUTPUT_MIME, contentSha256);

    const { data: existing } = await supabase
      .from('host_media_assets')
      .select('storage_path')
      .eq('user_id', userId)
      .eq('content_sha256', contentSha256)
      .maybeSingle();

    if (existing?.storage_path && (await r2GuestMediaExists(existing.storage_path))) {
      await r2DeleteGuestMedia(trimmed);
      return {
        ok: true,
        path: existing.storage_path,
        byteSize: compressed.length,
        contentSha256,
        reused: true,
      };
    }

    if (!(await r2GuestMediaExists(finalPath))) {
      const uploaded = await r2PutGuestMedia(finalPath, compressed, OUTPUT_MIME);
      if (!uploaded.ok) {
        return { ok: false, error: uploaded.error };
      }
    }

    const filename = finalPath.split('/').pop() ?? `${contentSha256}.mp4`;
    const assetId = crypto.randomUUID();
    const { error: insertError } = await supabase.from('host_media_assets').insert({
      id: assetId,
      user_id: userId,
      storage_path: finalPath,
      filename,
      mime_type: OUTPUT_MIME,
      byte_size: compressed.length,
      content_sha256: contentSha256,
    });

    if (insertError && (insertError as { code?: string }).code !== '23505') {
      return { ok: false, error: insertError.message };
    }

    await r2DeleteGuestMedia(trimmed);

    return {
      ok: true,
      path: finalPath,
      byteSize: compressed.length,
      contentSha256,
      reused: false,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Stayvo] server video transcode failed:', msg);
    return { ok: false, error: 'Could not compress video on the server. Try again in a moment.' };
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
