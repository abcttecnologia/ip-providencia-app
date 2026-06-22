const API_KEY = 'AIzaSyAnc-Acmcrk9GE1Bv5CoTyTVzvlHlK76pM';

const CHANNEL_ID = 'UC4HUbWq13CDWveVGGXhNbKA'; // vamos confirmar depois

export async function getLatestVideos() {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&maxResults=20&order=date&type=video&key=${API_KEY}`
  );

  const data = await response.json();

  return data.items ?? [];
}