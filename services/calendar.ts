const API_KEY = 'AIzaSyAnc-Acmcrk9GE1Bv5CoTyTVzvlHlK76pM';

const CALENDAR_ID =
  'igrejapresbiterianadonoroeste@gmail.com';

export async function getEventos() {
  const agora = new Date().toISOString();

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events?orderBy=startTime&singleEvents=true&timeMin=${agora}&maxResults=20&key=${API_KEY}`
  );

  const data = await response.json();

  console.log(data);

  return data.items ?? [];
}