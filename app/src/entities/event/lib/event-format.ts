import type { EventListItem } from '../model/types';

const PREVIEW_LENGTH = 100;

export function truncateEventBody(body: string): {
  text: string;
  hasMore: boolean;
} {
  if (body.length <= PREVIEW_LENGTH) {
    return { text: body, hasMore: false };
  }

  return {
    text: body.slice(0, PREVIEW_LENGTH).trimEnd(),
    hasMore: true,
  };
}

export function truncateChatPreview(text: string | null | undefined, maxLength = 48): string {
  if (!text) {
    return '';
  }

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trimEnd()}...`;
}

export function formatEventDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) {
    return 'Сегодня';
  }

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export type EventDateSection = {
  title: string;
  data: EventListItem[];
};

export function groupEventsByDate(events: EventListItem[]): EventDateSection[] {
  const sections = new Map<string, EventListItem[]>();

  for (const event of events) {
    const title = formatEventDate(event.createdAt);
    const existing = sections.get(title) ?? [];
    existing.push(event);
    sections.set(title, existing);
  }

  return Array.from(sections.entries()).map(([title, data]) => ({ title, data }));
}
