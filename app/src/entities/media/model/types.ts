export type PresignUploadPayload = {
  kind: 'avatar' | 'image' | 'document';
  mimeType: string;
  size: number;
  fileName?: string;
};

export type PresignUploadResponse = {
  mediaId: string;
  uploadUrl: string;
  objectKey: string;
  expiresIn: number;
};

export type MediaResponse = {
  id: string;
  kind: string;
  mimeType: string;
  size: number;
  status: string;
  downloadUrl: string | null;
  durationSeconds: number | null;
  createdAt: string;
};
