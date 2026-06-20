import { mediaApi } from '@/services/api';
import { uploadToPresignedUrl } from '@/lib/upload-to-presigned';
import type { ImagePickerAsset } from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
};

function resolveMimeType(asset: ImagePickerAsset): string {
  if (asset.mimeType) {
    return asset.mimeType;
  }

  const extension = asset.uri.split('.').pop()?.toLowerCase();
  if (extension && MIME_BY_EXTENSION[extension]) {
    return MIME_BY_EXTENSION[extension];
  }

  return 'image/jpeg';
}

async function resolveFileSize(uri: string, asset: ImagePickerAsset): Promise<number> {
  if (asset.fileSize && asset.fileSize > 0) {
    return asset.fileSize;
  }

  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists && !info.isDirectory && typeof info.size === 'number' && info.size > 0) {
    return info.size;
  }

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const estimatedSize = Math.floor((base64.length * 3) / 4);
  if (estimatedSize > 0) {
    return estimatedSize;
  }

  throw new Error('Could not determine image file size');
}

function resolveFileName(mimeType: string): string {
  if (mimeType === 'image/png') {
    return 'avatar.png';
  }

  if (mimeType === 'image/webp') {
    return 'avatar.webp';
  }

  return 'avatar.jpg';
}

export async function uploadAvatarImage(asset: ImagePickerAsset): Promise<string> {
  const mimeType = resolveMimeType(asset);
  const size = await resolveFileSize(asset.uri, asset);

  const presign = await mediaApi.presign({
    kind: 'avatar',
    mimeType,
    size,
    fileName: resolveFileName(mimeType),
  });

  await uploadToPresignedUrl(presign.uploadUrl, asset.uri, mimeType);
  await mediaApi.confirm(presign.mediaId);

  return presign.mediaId;
}

export function formatUploadError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Unknown upload error';
}
