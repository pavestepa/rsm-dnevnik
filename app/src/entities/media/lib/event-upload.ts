import { mediaApi } from '@/entities/media';
import { uploadToPresignedUrl } from './upload-to-presigned';
import type { ImagePickerAsset } from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

const IMAGE_MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
};

const DOCUMENT_MIME_BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  txt: 'text/plain',
};

type UploadFileInput = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
};

function resolveMimeType(uri: string, mimeType: string | null | undefined, fallbackMap: Record<string, string>, defaultMime: string): string {
  if (mimeType) {
    return mimeType;
  }

  const extension = uri.split('.').pop()?.toLowerCase();
  if (extension && fallbackMap[extension]) {
    return fallbackMap[extension];
  }

  return defaultMime;
}

async function resolveFileSize(uri: string, fileSize?: number | null): Promise<number> {
  if (fileSize && fileSize > 0) {
    return fileSize;
  }

  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists && !info.isDirectory && typeof info.size === 'number' && info.size > 0) {
    return info.size;
  }

  throw new Error('Could not determine file size');
}

async function uploadMedia(
  input: UploadFileInput,
  kind: 'image' | 'document',
  fallbackMap: Record<string, string>,
  defaultMime: string,
): Promise<string> {
  const mimeType = resolveMimeType(input.uri, input.mimeType, fallbackMap, defaultMime);
  const size = await resolveFileSize(input.uri, input.fileSize);
  const fileName = input.fileName ?? input.uri.split('/').pop() ?? 'file';

  const presign = await mediaApi.presign({
    kind,
    mimeType,
    size,
    fileName,
  });

  await uploadToPresignedUrl(presign.uploadUrl, input.uri, mimeType);
  await mediaApi.confirm(presign.mediaId);

  return presign.mediaId;
}

export async function uploadEventImage(asset: ImagePickerAsset): Promise<string> {
  return uploadMedia(
    {
      uri: asset.uri,
      mimeType: asset.mimeType,
      fileName: asset.fileName,
      fileSize: asset.fileSize,
    },
    'image',
    IMAGE_MIME_BY_EXTENSION,
    'image/jpeg',
  );
}

export async function uploadEventDocument(input: UploadFileInput): Promise<string> {
  return uploadMedia(
    input,
    'document',
    DOCUMENT_MIME_BY_EXTENSION,
    'application/pdf',
  );
}

export { formatUploadError } from './avatar-upload';
