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
  } catch (e) {
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
  } catch (error) {
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
  } catch (error) {
    const cached = await lerDoCache(CACHE_KEYS.VIDEOS + playlistId);
    return { data: cached || [], offline: true };
  }
}

export async function getVideoDetails(videoId: string) {
  try {
    let url = BASE_URL;
    url += '/videos?part=snippet,contentDetails';
    url += '&id=' + videoId;
    url += '&key=' + API_KEY;

    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      await salvarNoCache(CACHE_KEYS.DETAILS + videoId, data.items[0]);
      return { data: data.items[0], offline: false };
    }
    throw new Error("Erro");
  } catch (error) {
    const cached = await lerDoCache(CACHE_KEYS.DETAILS + videoId);
    return { data: cached, offline: true };
  }
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