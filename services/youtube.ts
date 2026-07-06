const API_KEY = 'AIzaSyAnc-Acmcrk9GE1Bv5CoTyTVzvlHlK76pM';

const CHANNEL_ID = 'UC4HUbWq13CDWveVGGXhNbKA';

export async function getPlaylists() {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/playlists?part=snippet&channelId=${CHANNEL_ID}&maxResults=50&key=${API_KEY}`
  );

  const data = await response.json();

  return data.items ?? [];
}

export async function getPlaylistVideos(
  playlistId: string
) {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=20&playlistId=${playlistId}&key=${API_KEY}`
  );

  const data = await response.json();

  return data.items ?? [];
}

export async function getLatestVideos() {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&maxResults=20&order=date&type=video&key=${API_KEY}`
  );

  const data = await response.json();

  return data.items ?? [];
}

export async function getVideoDetails(
  videoId: string
) {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${API_KEY}`
  );

  const data = await response.json();

  return data.items?.[0];
}