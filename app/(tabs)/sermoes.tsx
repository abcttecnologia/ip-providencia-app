import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {
  getPlaylists,
  getPlaylistVideos,
} from '../../services/youtube';
export default function SermoesScreen() {
  const [secoes, setSecoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    carregarSermoes();
  }, []);
  async function carregarSermoes() {
    try {
      const playlists = await getPlaylists();
      const playlistsOrdenadas =
        ordenarPlaylists(playlists);
      const secoesComVideos = await Promise.all(
        playlistsOrdenadas.map(
          async (playlist: any) => {
            const videos =
              await getPlaylistVideos(
                playlist.id
              );
            return {
              id: playlist.id,
              titulo:
                playlist.snippet.title,
              videos,
            };
          }
        )
      );
      setSecoes(
        secoesComVideos.filter(
          (secao) =>
            secao.videos.length > 0
        )
      );
    } catch (error) {
      console.log(
        'ERRO AO CARREGAR SERMÕES:',
        error
      );
    } finally {
      setLoading(false);
    }
  }
 function abrirVideo(video: any) {
  const videoId =
    video.snippet.resourceId?.videoId;

  if (!videoId) {
    console.log(
      'VideoId não encontrado',
      video
    );
    return;
  }

  router.push({
    pathname: '/player',
    params: {
      videoId,
      titulo: video.snippet.title,
    },
  });
}
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#ECE8DD',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator
          size="large"
          color="#546B5F"
        />
      </View>
    );
  }
return (
  <>
    <Stack.Screen options={{ headerShown: false }} />

    <View
      style={{
        flex: 1,
        backgroundColor: '#ECE8DD',
      }}
    >
      <ScrollView
  showsVerticalScrollIndicator={false}
  contentContainerStyle={{
    paddingBottom: 30,
  }}
>
       <View
  style={{
    backgroundColor: '#023411',
    paddingTop: 55,
    paddingBottom: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  }}
>
  <Pressable onPress={() => router.back()}>
    <Ionicons
      name="arrow-back"
      size={24}
      color="#FFF"
    />
  </Pressable>

  <Text
    style={{
      flex: 1,
      textAlign: 'center',
      color: '#FFF',
      fontSize: 20,
      fontWeight: '800',
      marginRight: 24,
    }}
  >
    Sermões
  </Text>
</View>

<Text
  style={{
    fontSize: 14,
    color: '#546B5F',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 30,
    lineHeight: 18,
  }}
>
  Acompanhe nossas séries de sermões e cresça no conhecimento das Escrituras.
</Text>
      {secoes.map((secao) => (
        <View
          key={secao.id}
          style={{
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: '700',
              color: '#023411',
              marginLeft: 16,
              marginBottom: 8,
            }}
          >
            {formatarTitulo(
              secao.titulo
            )}
          </Text>
          <FlatList
            horizontal
            data={secao.videos}
            keyExtractor={(item) =>
              item.id ||
              item.snippet.resourceId
                .videoId
            }
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={{
              paddingLeft: 16,
              paddingRight: 12,
            }}
            renderItem={({ item }) => (
              <VideoCard
                video={item}
                onPress={() =>
                  abrirVideo(item)
                }
              />
            )}
          />
        </View>
      ))}
    </ScrollView>
</View>
</>
  );
}
function VideoCard({
  video,
  onPress,
}: {
  video: any;
  onPress: () => void;
}) {
  const thumbnail =
    video.snippet.thumbnails?.high
      ?.url ||
    video.snippet.thumbnails?.medium
      ?.url ||
    video.snippet.thumbnails?.default
      ?.url;
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 120,
        marginRight: 10,
      }}
    >
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 18,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 1,
          },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        }}
      >
        <Image
          source={{
            uri: thumbnail,
          }}
          resizeMode="cover"
          style={{
            width: '100%',
            height: 68,
          }}
        />
        <View
          style={{
            padding: 6,
          }}
        >
          <Text
            numberOfLines={2}
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: '#023411',
              lineHeight: 13,
            }}
          >
            {limparTitulo(
              video.snippet.title
            )}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
function ordenarPlaylists(
  playlists: any[]
) {
  const prioridade = [
    'Série em ATOS',
    'Série em SAMUEL',
    'Panorama Antigo Testamento',
    'Panorama Novo Testamento',
  ];
  return [...playlists].sort(
    (a, b) => {
      const tituloA =
        a.snippet.title;
      const tituloB =
        b.snippet.title;
      const indexA =
        prioridade.findIndex(
          (p) =>
            normalizar(p) ===
            normalizar(tituloA)
        );
      const indexB =
        prioridade.findIndex(
          (p) =>
            normalizar(p) ===
            normalizar(tituloB)
        );
      if (
        indexA !== -1 &&
        indexB !== -1
      ) {
        return indexA - indexB;
      }
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return tituloA.localeCompare(
        tituloB
      );
    }
  );
}
function normalizar(
  texto: string
) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .trim();
}
function formatarTitulo(
  titulo: string
) {
  return titulo
    .replace('Série em ', '')
    .replace('Serie em ', '')
    .trim();
}
function limparTitulo(
  titulo: string
) {
  return titulo
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}