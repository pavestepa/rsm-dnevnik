export type EventAuthor = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

export type EventGroup = {
  id: string;
  title: string;
  avatarUrl: string | null;
};

export type EventImage = {
  id: string;
  url: string;
};

export type EventFile = {
  id: string;
  fileName: string;
  mimeType: string;
  downloadUrl: string | null;
};

export type EventChatPreview = {
  lastMessage: {
    text: string | null;
    createdAt: string;
  } | null;
  writerAvatars: EventAuthor[];
};

export type EventListItem = {
  id: string;
  title: string;
  bodyPreview: string;
  body?: string;
  createdAt: string;
  updatedAt: string;
  author: EventAuthor;
  group: EventGroup;
  images: EventImage[];
  totalImages: number;
  filesCount: number;
  files?: EventFile[];
  chatId: string;
  chatPreview: EventChatPreview;
  canEdit: boolean;
  canDelete: boolean;
};

export type EventDetail = EventListItem & {
  body: string;
  files: EventFile[];
};

export type EventMediaInput = {
  mediaId: string;
  kind: 'image' | 'file';
  fileName?: string;
};

export type CreateEventPayload = {
  groupChatId: string;
  title: string;
  body: string;
  media?: EventMediaInput[];
};

export type UpdateEventPayload = {
  groupChatId?: string;
  title?: string;
  body?: string;
  media?: EventMediaInput[];
};

export type EventsPage = {
  items: EventListItem[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type EventsQueryData = {
  pages: EventsPage[];
  pageParams: (string | undefined)[];
};
