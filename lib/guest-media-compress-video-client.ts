import { GUEST_VIDEO_MAX_BYTES } from '@/lib/guest-property-media';

const COMPRESS_TIMEOUT_MS = 4 * 60 * 1000;
const FFMPEG_PUBLIC_BASE = '/ffmpeg';

export type GuestVideoCompressResult = {
  file: File;
  compressed: boolean;
  /** Shown when the original file was uploaded instead. */
  warning?: string;
};

type FfmpegBundle = {
  ffmpeg: import('@ffmpeg/ffmpeg').FFmpeg;
  fetchFile: typeof import('@ffmpeg/util').fetchFile;
};

let ffmpegBundlePromise: Promise<FfmpegBundle> | null = null;

function inputExtension(file: File): string {
  const fromName = (file.name || '').match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
  if (fromName) return fromName;
  const type = (file.type || '').toLowerCase();
  if (type.includes('quicktime')) return 'mov';
  if (type.includes('webm')) return 'webm';
  if (type.includes('ogg')) return 'ogg';
  return 'mp4';
}

function formatMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function loadFfmpeg(): Promise<FfmpegBundle> {
  const { FFmpeg } = await import('@ffmpeg/ffmpeg');
  const { fetchFile, toBlobURL } = await import('@ffmpeg/util');
  const ffmpeg = new FFmpeg();

  const origin =
    typeof window !== 'undefined' ? window.location.origin : '';
  const baseURL = `${origin}${FFMPEG_PUBLIC_BASE}`;

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  return { ffmpeg, fetchFile };
}

async function getFfmpeg(): Promise<FfmpegBundle> {
  if (!ffmpegBundlePromise) {
    ffmpegBundlePromise = loadFfmpeg().catch((err) => {
      ffmpegBundlePromise = null;
      throw err;
    });
  }
  return ffmpegBundlePromise;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('COMPRESS_TIMEOUT')), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

function fallbackResult(file: File, reason: string): GuestVideoCompressResult {
  return {
    file,
    compressed: false,
    warning: reason,
  };
}

/**
 * Re-encode guest guide videos in-browser (H.264 MP4, max 1280×720).
 * Falls back to the original when compression is unavailable on this device.
 */
export async function compressGuestVideoForUpload(
  file: File,
  options?: { onProgress?: (ratio: number) => void }
): Promise<GuestVideoCompressResult> {
  if (file.size > GUEST_VIDEO_MAX_BYTES) {
    throw new Error('Video must be 30 MB or smaller.');
  }

  const run = async (): Promise<GuestVideoCompressResult> => {
    options?.onProgress?.(0.02);
    const { ffmpeg, fetchFile } = await getFfmpeg();
    options?.onProgress?.(0.12);

    const inputName = `input.${inputExtension(file)}`;
    const outputName = 'output.mp4';

    const progressHandler = ({ progress }: { progress: number }) => {
      if (Number.isFinite(progress)) {
        options?.onProgress?.(0.12 + progress * 0.88);
      }
    };
    ffmpeg.on('progress', progressHandler);

    try {
      await ffmpeg.writeFile(inputName, await fetchFile(file));
      await ffmpeg.exec([
        '-i',
        inputName,
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
        outputName,
      ]);

      const data = await ffmpeg.readFile(outputName);
      const bytes =
        data instanceof Uint8Array ? data : new TextEncoder().encode(String(data));
      const blob = new Blob([new Uint8Array(bytes)], { type: 'video/mp4' });

      if (blob.size > GUEST_VIDEO_MAX_BYTES) {
        throw new Error('COMPRESS_TOO_LARGE');
      }

      const baseName = (file.name || 'video').replace(/\.[^.]+$/, '') || 'video';
      const outFile = new File([blob], `${baseName}.mp4`, { type: 'video/mp4' });

      const savedBytes = file.size - outFile.size;
      if (savedBytes < 64 * 1024) {
        return {
          file: outFile,
          compressed: true,
          warning: `Video optimized for web playback (${formatMb(outFile.size)}).`,
        };
      }

      return {
        file: outFile,
        compressed: true,
      };
    } finally {
      ffmpeg.off('progress', progressHandler);
      for (const name of [inputName, outputName]) {
        try {
          await ffmpeg.deleteFile(name);
        } catch {
          /* ignore */
        }
      }
    }
  };

  try {
    return await withTimeout(run(), COMPRESS_TIMEOUT_MS);
  } catch (err) {
    const code = err instanceof Error ? err.message : String(err);
    if (code === 'COMPRESS_TOO_LARGE') {
      throw new Error(
        'Video is still too large after compression. Try a shorter clip, then upload again.'
      );
    }
    if (code === 'COMPRESS_TIMEOUT') {
      return fallbackResult(
        file,
        'Compression timed out — uploaded the original video. Try a shorter clip for a smaller file.'
      );
    }
    console.warn('[Stayvo] guest video compression failed:', err);
    return fallbackResult(
      file,
      'Could not compress on this device — uploaded the original video.'
    );
  }
}
