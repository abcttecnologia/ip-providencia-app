import AsyncStorage from "@react-native-async-storage/async-storage";

import { requireEnv } from './env';

// --- CONFIGURAÇÕES DO YOUTUBE ---
const API_KEY = requireEnv(
  'EXPO_PUBLIC_GOOGLE_API_KEY',
  process.env.EXPO_PUBLIC_GOOGLE_API_KEY,
);
const CHANNEL_ID = 'UC4HUbWq13CDWveVGGXhNbKA'.trim(); 
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

const CACHE_KEYS = {
  PLAYLISTS: '@youtube_playlists',
  VIDEOS: '@youtube_videos_',
  HOME_VIDEOS: '@youtube_home_videos',
  DETAILS: '@youtube_details_'
};

export interface YouTubeVideoDetails {
  id: string;
  snippet?: {
    publishedAt?: string;
    description?: string;
  };
  contentDetails?: {
    duration?: string;
  };
}

// --- CACHE ---
async function salvarNoCache(chave: string, dados: any) {
  try {
    if (dados) {
      await AsyncStorage.setItem(chave, JSON.stringify(dados));
    }
  } catch (e) {
    console.error("Erro cache:", e);
  }
}

async function lerDoCache(chave: string) {
  try {
    const valor = await AsyncStorage.getItem(chave);
    return valor ? JSON.parse(valor) : null;
  } catch {
    return null;
  }
}

// --- FUNÇÕES ---

export async function getPlaylists() {
  try {
    // Montagem manual da URL para evitar erros de caractere especial
    let url = BASE_URL;
    url += '/playlists?part=snippet,contentDetails';
    url += '&channelId=' + CHANNEL_ID;
    url += '&maxResults=50';
    url += '&key=' + API_KEY;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
      const data = await response.json();
      await salvarNoCache(CACHE_KEYS.PLAYLISTS, data.items);
      return { data: data.items, offline: false };
    }
    throw new Error("Erro API");
  } catch {
    const cached = await lerDoCache(CACHE_KEYS.PLAYLISTS);
    return { data: cached || [], offline: true };
  }
}

export async function getPlaylistVideos(playlistId: string) {
  try {
    let url = BASE_URL;
    url += '/playlistItems?part=snippet,contentDetails';
    url += '&maxResults=50';
    url += '&playlistId=' + playlistId;
    url += '&key=' + API_KEY;

    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      await salvarNoCache(CACHE_KEYS.VIDEOS + playlistId, data.items);
      return { data: data.items, offline: false };
    }
    throw new Error("Erro");
  } catch {
    const cached = await lerDoCache(CACHE_KEYS.VIDEOS + playlistId);
    return { data: cached || [], offline: true };
  }
}

export async function getVideoDetails(videoId: string) {
  const resultado = await getVideoDetailsBatch([videoId]);
  return {
    data: resultado.data[videoId],
    offline: resultado.offline,
  };
}

export async function getVideoDetailsBatch(videoIds: string[]) {
  const ids = [...new Set(videoIds.filter(Boolean))];
  const details: Record<string, YouTubeVideoDetails> = {};
  let offline = false;

  for (let index = 0; index < ids.length; index += 50) {
    const batch = ids.slice(index, index + 50);
    try {
      let url = BASE_URL;
      url += '/videos?part=snippet,contentDetails';
      url += '&id=' + batch.join(',');
      url += '&key=' + API_KEY;

      const response = await fetch(url);
      if (!response.ok) throw new Error("Erro");

      const data = await response.json();
      await Promise.all(
        (data.items ?? []).map(async (item: YouTubeVideoDetails) => {
          details[item.id] = item;
          await salvarNoCache(CACHE_KEYS.DETAILS + item.id, item);
        }),
      );
    } catch {
      offline = true;
      await Promise.all(
        batch.map(async (videoId) => {
          const cached = await lerDoCache(CACHE_KEYS.DETAILS + videoId);
          if (cached) details[videoId] = cached;
        }),
      );
    }
  }

  return { data: details, offline };
}

export async function getLatestVideos() {
  return getPlaylists();
}

export async function getVideos() {
  try {
    // Busca os vídeos mais recentes enviados para o canal
    const url = BASE_URL + '/search?part=snippet&channelId=' + CHANNEL_ID + '&maxResults=1&order=date&type=video&key=' + API_KEY;
    
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      const videos = data.items ?? [];
      await salvarNoCache(CACHE_KEYS.HOME_VIDEOS, videos);
      return { data: videos, offline: false };
    }
    throw new Error(`YouTube API respondeu ${response.status}`);
  } catch (error) {
    console.warn('Falha ao carregar os vídeos mais recentes; usando cache:', error);
    const cache = await lerDoCache(CACHE_KEYS.HOME_VIDEOS);
    return {
      data: cache ?? [],
      offline: Boolean(cache?.length),
    };
  }
}