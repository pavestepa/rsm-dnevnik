import { chatApi, invalidateChatListQueries } from '@/entities/chat';
import { uploadAvatarImage } from '@/entities/media';
import { useChangeGroupChatMainImage } from '@/features/change-group-chat-main-image/useChangeGroupChatMainImage';
import { renderHookWithProviders } from '@/shared/test';

jest.mock('@/entities/chat', () => ({
  chatApi: {
    updateGroup: jest.fn(),
  },
  invalidateChatListQueries: jest.fn(),
}));

jest.mock('@/entities/media', () => ({
  uploadAvatarImage: jest.fn(),
}));

const mockedChatApi = chatApi as jest.Mocked<typeof chatApi>;
const mockedUploadAvatarImage = uploadAvatarImage as jest.MockedFunction<
  typeof uploadAvatarImage
>;

describe('useChangeGroupChatMainImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uploads avatar and updates group', async () => {
    const asset = { uri: 'file://avatar.jpg' } as never;
    const updatedChat = { id: 'chat-1', avatarUrl: 'https://cdn/avatar.jpg' };
    mockedUploadAvatarImage.mockResolvedValue('media-1');
    mockedChatApi.updateGroup.mockResolvedValue(updatedChat as never);

    const { result } = renderHookWithProviders(() =>
      useChangeGroupChatMainImage('chat-1'),
    );

    await result.current.mutateAsync(asset);

    expect(mockedUploadAvatarImage).toHaveBeenCalledWith(asset);
    expect(mockedChatApi.updateGroup).toHaveBeenCalledWith('chat-1', {
      avatarMediaId: 'media-1',
    });
  });
});
