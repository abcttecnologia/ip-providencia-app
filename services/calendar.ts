import { lerCache, salvarCache } from './cache';
import { ServiceResult } from './types';

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_CALENDAR_API_KEY!;

const CALENDAR_ID =
  'igrejapresbiterianadonoroeste@gmail.com';

export async function getEventos(): Promise<ServiceResult<any[]>> {
  try {
    const agora = new Date().toISOString();

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events?orderBy=startTime&singleEvents=true&timeMin=${agora}&maxResults=20&key=${API_KEY}`
    );

    const data = await response.json();

    const eventos = data.items ?? [];

    await salvarCache('agenda', eventos);

    return {
      data: eventos,
      offline: false,
    };
  } catch (error) {
    console.log('Usando cache da agenda');

    return {
      data: (await lerCache<any[]>('agenda')) ?? [],
      offline: true,
    };
  }
}