import { GUEST_VIDEO_MAX_BYTES } from '@/lib/guest-property-media';

/** Skip re-encode when already small (typical after phone export). */
const SKIP_BELOW_BYTES = 4 * 1024 * 1024;
const COMPRESS_TIMEOUT_MS = 3 * 60 * 1000;
const FFMPEG_CORE_VERSION = '0.12.6';

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

async function loadFfmpeg(onLoadProgress?: (ratio: number) => void): Promise<FfmpegBundle> {
  const { FFmpeg } = await import('@ffmpeg/ffmpeg');
  const { fetchFile, toBlobURL } = await import('@ffmpeg/util');
  const ffmpeg = new FFmpeg();

  if (onLoadProgress) {
    ffmpeg.on('log', () => {});
    ffmpeg.on('progress', ({ progress }) => {
      if (Number.isFinite(progress)) onLoadProgress(Math.min(1, Math.max(0, progress)));
    });
  }

  const baseURL = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/esm`;
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  return { ffmpeg, fetchFile };
}

async function getFfmpeg(onLoadProgress?: (ratio: number) => void): Promise<FfmpegBundle> {
  if (!ffmpegBundlePromise) {
    ffmpegBundlePromise = loadFfmpeg(onLoadProgress);
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

/**
 * Re-encode guest guide videos in-browser (H.264 MP4, max 1280px wide).
 * Falls back to the original file if compression fails or times out.
 */
export async function compressGuestVideoForUpload(
  file: File,
  options?: { onProgress?: (ratio: number) => void }
): Promise<File> {
  if (file.size <= SKIP_BELOW_BYTES) return file;

  const run = async (): Promise<File> => {
    const bundle = await getFfmpeg((ratio) => options?.onProgress?.(ratio * 0.15));
    const { ffmpeg, fetchFile } = bundle;

    const inputName = `input.${inputExtension(file)}`;
    const outputName = 'output.mp4';

    const progressHandler = ({ progress }: { progress: number }) => {
      if (Number.isFinite(progress)) {
        options?.onProgress?.(0.15 + progress * 0.85);
      }
    };
    ffmpeg.on('progress', progressHandler);

    try {
      await ffmpeg.writeFile(inputName, await fetchFile(file));
      await ffmpeg.exec([
        '-i',
        inputName,
        '-vf',
        "scale='min(1280,iw)':-2",
        '-c:v',
        'libx264',
        '-crf',
        '28',
        '-preset',
        'fast',
        '-c:a',
        'aac',
        '-b:a',
        '128k',
        '-movflags',
        '+faststart',
        outputName,
      ]);

      const data = await ffmpeg.readFile(outputName);
      const bytes =
        data instanceof Uint8Array ? data : new TextEncoder().encode(String(data));
      const blob = new Blob([new Uint8Array(bytes)], { type: 'video/mp4' });

      if (blob.size >= file.size) return file;
      if (blob.size > GUEST_VIDEO_MAX_BYTES) {
        throw new Error('COMPRESS_TOO_LARGE');
      }

      const baseName = (file.name || 'video').replace(/\.[^.]+$/, '') || 'video';
      return new File([blob], `${baseName}.mp4`, { type: 'video/mp4' });
    } finally {
      ffmpeg.off('progress', progressHandler);
      try {
        await ffmpeg.deleteFile(inputName);
      } catch {
        /* ignore */
      }
      try {
        await ffmpeg.deleteFile(outputName);
      } catch {
        /* ignore */
      }
    }
  };

  try {
    return await withTimeout(run(), COMPRESS_TIMEOUT_MS);
  } catch (err) {
    const code = err instanceof Error ? err.message : '';
    if (code === 'COMPRESS_TOO_LARGE') {
      throw new Error(
        'Video is still too large after compression. Try a shorter clip or lower resolution, then upload again.'
      );
    }
    if (file.size > GUEST_VIDEO_MAX_BYTES) {
      throw new Error('Video must be 30 MB or smaller.');
    }
    return file;
  }
}
