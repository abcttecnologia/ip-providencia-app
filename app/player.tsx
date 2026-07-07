import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';

import { getVideoDetails } from '../services/youtube';

export default function PlayerScreen() {
  const params = useLocalSearchParams();

console.log(params);

const videoId = Array.isArray(params.videoId)
  ? params.videoId[0]
  : params.videoId;

const titulo = Array.isArray(params.titulo)
  ? params.titulo[0]
  : params.titulo;


  const [descricao, setDescricao] = useState('');
  const [erroPlayer, setErroPlayer] = useState('');

  useEffect(() => {
  async function carregarVideo() {
    try {
      if (!videoId) return;

      console.log('VIDEO ID:', videoId);

      const video = await getVideoDetails(videoId as string);

      console.log('VIDEO:', video);

      setDescricao(video?.snippet?.description ?? '');
    } catch (error) {
      console.log('ERRO:', error);
    }
  }

  carregarVideo();
}, [videoId]);

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: '#ECE8DD',
      }}
      showsVerticalScrollIndicator={false}
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
    {titulo}
  </Text>
</View>

      <YoutubePlayer
        height={220}
        play={false}
        videoId={videoId as string}
      onError={(e: any) => {
  console.log('YOUTUBE ERROR:', e);
  setErroPlayer('Erro ao carregar o vídeo.');
}}
      />

      {erroPlayer ? (
        <Text
          style={{
            color: 'red',
            textAlign: 'center',
            marginTop: 10,
            marginHorizontal: 20,
            fontWeight: '700',
          }}
        >
          Erro do YouTube: {erroPlayer}
        </Text>
      ) : null}

      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 30,
          paddingBottom: 40,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: '700',
            color: '#023411',
            marginBottom: 12,
          }}
        >
          {titulo}
        </Text>

        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 14,
            padding: 16,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              color: '#555',
              lineHeight: 22,
            }}
          >
            {descricao || 'Descrição não disponível.'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}