import imageCompression from 'browser-image-compression';

import { GUEST_IMAGE_MAX_BYTES } from '@/lib/guest-property-media';

/** Client-side image compression before guest media upload (images only). */
export async function compressGuestImageForUpload(file: File): Promise<File> {
  const type = (file.type || '').toLowerCase();
  const name = file.name || '';
  const preservePng = type === 'image/png' || /\.png$/i.test(name);
  const preserveGif = type === 'image/gif' || /\.gif$/i.test(name);

  const options: Parameters<typeof imageCompression>[1] = {
    maxSizeMB: 1.5,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    initialQuality: 0.82,
  };

  if (!preservePng && !preserveGif) {
    options.fileType = 'image/jpeg';
  }

  try {
    const compressed = await imageCompression(file, options);
    if (compressed.size >= file.size) return file;
    return compressed;
  } catch {
    if (file.size <= GUEST_IMAGE_MAX_BYTES) return file;
    throw new Error(
      'Could not compress this image. Try saving as JPEG and uploading again.'
    );
  }
}
