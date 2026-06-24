import { api } from '@/shared/api/client';
import type { MediaResponse, PresignUploadPayload, PresignUploadResponse } from '../model/types';

export const mediaApi = {
  presign: (payload: PresignUploadPayload) =>
    api.post<PresignUploadResponse>('/media/presign', payload),
  confirm: (mediaId: string) =>
    api.post<MediaResponse>(`/media/${mediaId}/confirm`),
};
