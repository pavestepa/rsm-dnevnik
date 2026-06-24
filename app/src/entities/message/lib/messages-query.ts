import type { InfiniteData } from '@tanstack/react-query';
import type { Message, PaginatedResult } from '../model/types';

export type MessagesQueryPage = PaginatedResult<Message>;
export type MessagesQueryData = InfiniteData<MessagesQueryPage, string | undefined>;
