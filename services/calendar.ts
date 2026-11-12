import { lerCache, salvarCache } from './cache';
import { requireEnv } from './env';
import type { ServiceResult } from '../types/firestore';

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
  };
}

const API_KEY = requireEnv(
  'EXPO_PUBLIC_GOOGLE_API_KEY',
  process.env.EXPO_PUBLIC_GOOGLE_API_KEY,
);

const CALENDAR_ID =
  'igrejapresbiterianadonoroeste@gmail.com';

export async function getEventos(): Promise<
  ServiceResult<GoogleCalendarEvent[]>
> {
  try {
    const agora = new Date().toISOString();

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events?orderBy=startTime&singleEvents=true&timeMin=${agora}&maxResults=20&key=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Google Calendar API respondeu ${response.status}`);
    }

    const data: { items?: GoogleCalendarEvent[] } = await response.json();

    const eventos = (data.items ?? []).map((evento) => ({
      ...evento,
      summary: evento.summary ?? '',
      start: evento.start ?? {},
    }));

    await salvarCache('agenda', eventos);

    return {
      data: eventos,
      offline: false,
    };
  } catch (error) {
    console.warn('Falha ao carregar a agenda; usando cache:', error);
    const cache = await lerCache<GoogleCalendarEvent[]>('agenda');

    return {
      data: cache ?? [],
      offline: Boolean(cache?.length),
    };
  }
}