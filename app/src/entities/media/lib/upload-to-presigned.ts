import { env } from '@/shared/config/env';
import * as FileSystem from 'expo-file-system/legacy';
import { FileSystemUploadType } from 'expo-file-system/legacy';

function rewriteUploadUrl(uploadUrl: string): string {
  if (!__DEV__) {
    return uploadUrl;
  }

  try {
    const apiHost = new URL(env.apiUrl).hostname;

    if (apiHost === 'localhost' || apiHost === '127.0.0.1') {
      return uploadUrl;
    }

    const parsed = new URL(uploadUrl);
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      parsed.hostname = apiHost;
      return parsed.toString();
    }
  } catch {
    // keep original url
  }

  return uploadUrl;
}

export async function uploadToPresignedUrl(
  uploadUrl: string,
  uri: string,
  mimeType: string,
): Promise<void> {
  const targetUrl = rewriteUploadUrl(uploadUrl);

  const result = await FileSystem.uploadAsync(targetUrl, uri, {
    httpMethod: 'PUT',
    uploadType: FileSystemUploadType.BINARY_CONTENT,
    headers: {
      'Content-Type': mimeType,
    },
  });

  if (result.status < 200 || result.status >= 300) {
    const details = result.body?.trim().slice(0, 200);
    throw new Error(
      details
        ? `Storage upload failed (${result.status}): ${details}`
        : `Storage upload failed (${result.status})`,
    );
  }
}
