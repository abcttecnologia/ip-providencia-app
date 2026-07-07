const API_KEY = 'AIzaSyAnc-Acmcrk9GE1Bv5CoTyTVzvlHlK76pM';

const CHANNEL_ID = 'UC4HUbWq13CDWveVGGXhNbKA';

import { lerCache, salvarCache } from './cache';

export async function getPlaylists() {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/playlists?part=snippet&channelId=${CHANNEL_ID}&maxResults=50&key=${API_KEY}`
    );

    const data = await response.json();

    const playlists = data.items ?? [];

    await salvarCache('youtube_playlists', playlists);

    return playlists;

  } catch (error) {
    console.log('Usando cache das playlists');

    return (await lerCache<any[]>('youtube_playlists')) ?? [];
  }
}

export async function getPlaylistVideos(
  playlistId: string
) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=20&playlistId=${playlistId}&key=${API_KEY}`
    );

    const data = await response.json();

    const videos = data.items ?? [];

    await salvarCache(`playlist_${playlistId}`, videos);

    return videos;

  } catch (error) {
    console.log('Usando cache da playlist');

    return (
      await lerCache<any[]>(`playlist_${playlistId}`)
    ) ?? [];
  }
}

export async function getLatestVideos() {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&maxResults=20&order=date&type=video&key=${API_KEY}`
    );

    const data = await response.json();

    const videos = data.items ?? [];

    await salvarCache('youtube_latest', videos);

    return videos;

  } catch (error) {
    console.log('Usando cache dos últimos vídeos');

    return (
      await lerCache<any[]>('youtube_latest')
    ) ?? [];
  }
}

export async function getVideoDetails(
  videoId: string
) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${API_KEY}`
    );

    const data = await response.json();

    const video = data.items?.[0];

    await salvarCache(`video_${videoId}`, video);

    return video;

  } catch (error) {
    console.log('Usando cache do vídeo');

    return await lerCache(`video_${videoId}`);
  }
}