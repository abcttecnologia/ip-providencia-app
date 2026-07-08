import { lerCache, salvarCache } from './cache';
import { ServiceResult } from './types';

const API_KEY = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY!;
const CHANNEL_ID = 'UC4HUbWq13CDWveVGGXhNbKA';

export async function getPlaylists(): Promise<ServiceResult<any[]>> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/playlists?part=snippet&channelId=${CHANNEL_ID}&maxResults=50&key=${API_KEY}`
    );

    const data = await response.json();

    const playlists = data.items ?? [];

    await salvarCache('youtube_playlists', playlists);

    return {
      data: playlists,
      offline: false,
    };
  } catch (error) {
    console.log('Usando cache das playlists');

    return {
      data:
        (await lerCache<any[]>('youtube_playlists')) ??
        [],
      offline: true,
    };
  }
}

export async function getPlaylistVideos(
  playlistId: string
): Promise<ServiceResult<any[]>> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=20&playlistId=${playlistId}&key=${API_KEY}`
    );

    const data = await response.json();

    const videos = data.items ?? [];

    await salvarCache(
      `playlist_${playlistId}`,
      videos
    );

    return {
      data: videos,
      offline: false,
    };
  } catch (error) {
    console.log('Usando cache da playlist');

    return {
      data:
        (await lerCache<any[]>(
          `playlist_${playlistId}`
        )) ?? [],
      offline: true,
    };
  }
}

export async function getLatestVideos(): Promise<ServiceResult<any[]>> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&maxResults=20&order=date&type=video&key=${API_KEY}`
    );

    const data = await response.json();

    const videos = data.items ?? [];

    await salvarCache(
      'youtube_latest',
      videos
    );

    return {
      data: videos,
      offline: false,
    };
  } catch (error) {
    console.log(
      'Usando cache dos últimos vídeos'
    );

    return {
      data:
        (await lerCache<any[]>(
          'youtube_latest'
        )) ?? [],
      offline: true,
    };
  }
}

export async function getVideoDetails(
  videoId: string
): Promise<ServiceResult<any | null>> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${API_KEY}`
    );

    const data = await response.json();

    const video =
      data.items?.[0] ?? null;

    await salvarCache(
      `video_${videoId}`,
      video
    );

    return {
      data: video,
      offline: false,
    };
  } catch (error) {
    console.log('Usando cache do vídeo');

    return {
      data:
        (await lerCache(
          `video_${videoId}`
        )) ?? null,
      offline: true,
    };
  }
}