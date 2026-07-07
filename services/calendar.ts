import { lerCache, salvarCache } from './cache';

const API_KEY = 'SUA_API_KEY';

const CALENDAR_ID =
  'igrejapresbiterianadonoroeste@gmail.com';

export async function getEventos() {
  try {
    const agora = new Date().toISOString();

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events?orderBy=startTime&singleEvents=true&timeMin=${agora}&maxResults=20&key=${API_KEY}`
    );

    const data = await response.json();

    const eventos = data.items ?? [];

    await salvarCache('agenda', eventos);

    return eventos;

  } catch (error) {
    console.log('Usando cache da agenda');

    return (await lerCache<any[]>('agenda')) ?? [];
  }
}