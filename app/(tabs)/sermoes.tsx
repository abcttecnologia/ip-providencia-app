import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  View
} from 'react-native';

import AppHeader from '../../components/ui/AppHeader';
import OfflineBanner from '../../components/ui/OfflineBanner';
import RefreshableScroll from '../../components/ui/RefreshableScroll';
import Screen from '../../components/ui/Screen';

import {
  getPlaylists,
  getPlaylistVideos,
} from '../../services/youtube';

export default function SermoesScreen() {
  const [secoes, setSecoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);

  // Função de carregar simplificada para evitar loops
  const carregarSermoes = useCallback(async () => {
    try {
      const resultadoPlaylists = await getPlaylists();
      
      // Se a API retornar offline, avisamos mas tentamos processar o que vier
      setOffline(resultadoPlaylists.offline || false);

      if (!resultadoPlaylists.data || resultadoPlaylists.data.length === 0) {
        setSecoes([]);
        return;
      }

      const playlistsOrdenadas = ordenarPlaylists(resultadoPlaylists.data);

      // Carregamento paralelo (mais rápido)
      const secoesComVideosPromises = playlistsOrdenadas.map(async (playlist: any) => {
        try {
          const resultadoVideos = await getPlaylistVideos(playlist.id);
          return {
            offline: resultadoVideos.offline,
            secao: resultadoVideos.data?.length > 0
              ? {
                  id: playlist.id,
                  titulo: playlist.snippet.title,
                  videos: resultadoVideos.data,
                }
              : null,
          };
        } catch (e) {
          return { offline: true, secao: null };
        }
      });

      const resultados = await Promise.all(secoesComVideosPromises);
      setOffline(resultadoPlaylists.offline || resultados.some(resultado => resultado.offline));
      setSecoes(resultados.map(resultado => resultado.secao).filter(secao => secao !== null));

    } catch (error) {
      console.error('Erro ao carregar:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Chama apenas uma vez ao montar a tela
  useEffect(() => {
    carregarSermoes();
  }, []); 

  const atualizar = () => {
    setRefreshing(true);
    carregarSermoes();
  };

  function abrirVideo(video: any) {
    const videoId = video.snippet.resourceId?.videoId || video.id;
    if (!videoId) return;

    router.push({
      pathname: '/player',
      params: { videoId, titulo: video.snippet.title },
    });
  }

  if (loading) {
    return (
      <Screen>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#023411" />
          <Text style={{ marginTop: 10, color: '#546B5F' }}>Buscando sermões...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader title="Sermões" showBack={false} />
      <OfflineBanner visible={offline} />

      <RefreshableScroll
        refreshing={refreshing}
        onRefresh={atualizar}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <Text style={{
          fontSize: 14,
          color: '#546B5F',
          textAlign: 'center',
          marginBottom: 20,
          paddingHorizontal: 30,
        }}>
          Acompanhe nossas séries de sermões e cresça no conhecimento das Escrituras.
        </Text>

        {secoes.length === 0 && (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ textAlign: 'center', color: '#546B5F' }}>
              {offline ? "Você parece estar offline." : "Nenhum sermão encontrado."}
            </Text>
            <Pressable onPress={atualizar} style={{ marginTop: 20, padding: 10, backgroundColor: '#023411', borderRadius: 8 }}>
              <Text style={{ color: '#FFF' }}>Tentar Novamente</Text>
            </Pressable>
          </View>
        )}

        {secoes.map((secao) => (
          <View key={secao.id} style={{ marginBottom: 16 }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '700',
              color: '#023411',
              marginLeft: 16,
              marginBottom: 8,
            }}>
              {secao.titulo.replace(/S[eé]rie em /i, '').trim()}
            </Text>

            <FlatList
              horizontal
              data={secao.videos}
              keyExtractor={(item) => item.id || (item.snippet?.resourceId?.videoId) || Math.random().toString()}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 16, paddingRight: 12 }}
              renderItem={({ item }) => (
                <Pressable 
                  onPress={() => abrirVideo(item)}
                  style={{ width: 120, marginRight: 10 }}
                >
                  <View style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 18,
                    overflow: 'hidden',
                    elevation: 2,
                  }}>
                    <Image
                      source={{ uri: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || 'https://via.placeholder.com/120x68' }}
                      style={{ width: '100%', height: 68 }}
                    />
                    <View style={{ padding: 6 }}>
                      <Text numberOfLines={2} style={{ fontSize: 10, fontWeight: '700', color: '#023411' }}>
                        {item.snippet.title}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              )}
            />
          </View>
        ))}
      </RefreshableScroll>
    </Screen>
  );
}

// Funções auxiliares mantidas fora do componente para performance
function ordenarPlaylists(playlists: any[]) {
  const prioridade = ['Série em ATOS', 'Série em SAMUEL', 'Panorama Antigo Testamento', 'Panorama Novo Testamento'];
  const normalizar = (t: string) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  return [...playlists].sort((a, b) => {
    const tA = a.snippet.title;
    const tB = b.snippet.title;
    const idxA = prioridade.findIndex(p => normalizar(p) === normalizar(tA));
    const idxB = prioridade.findIndex(p => normalizar(p) === normalizar(tB));
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return tA.localeCompare(tB);
  });
}
