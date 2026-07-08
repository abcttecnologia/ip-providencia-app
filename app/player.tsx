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

import OfflineBanner from '../components/ui/OfflineBanner';
import { getVideoDetails } from '../services/youtube';

export default function PlayerScreen() {
  const params = useLocalSearchParams();

  const videoId = Array.isArray(params.videoId)
    ? params.videoId[0]
    : params.videoId;

  const titulo = Array.isArray(params.titulo)
    ? params.titulo[0]
    : params.titulo;

  const [descricao, setDescricao] =
    useState('');

  const [erroPlayer, setErroPlayer] =
    useState('');

  const [offline, setOffline] =
    useState(false);

  useEffect(() => {
    async function carregarVideo() {
      try {
        if (!videoId) return;

        const resultado =
          await getVideoDetails(
            videoId as string
          );

        setOffline(
          resultado.offline
        );

        setDescricao(
          resultado.data?.snippet
            ?.description ?? ''
        );
      } catch (error) {
        console.log(error);
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
        }}
      >
        <Pressable
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#FFF"
          />
        </Pressable>

        <View style={{ flex: 1 }} />
      </View>

      <OfflineBanner
        visible={offline}
      />

      <YoutubePlayer
        height={235}
        play={false}
        videoId={videoId as string}
        onError={(e: any) => {
          console.log(e);

          setErroPlayer(
            'Erro ao carregar o vídeo.'
          );
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
          {erroPlayer}
        </Text>
      ) : null}

      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 24,
          paddingBottom: 40,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: '700',
            color: '#023411',
            marginBottom: 18,
          }}
        >
          {titulo}
        </Text>

        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 18,

            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              color: '#555',
              lineHeight: 24,
            }}
          >
            {descricao ||
              'Descrição não disponível.'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}