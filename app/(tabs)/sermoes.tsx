import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { getLatestVideos } from '../../services/youtube';

export default function SermoesScreen() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarVideos();
  }, []);

  async function carregarVideos() {
    const dados = await getLatestVideos();
    setVideos(dados);
    setLoading(false);
  }

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#ECE8DD',
        }}
      >
        <ActivityIndicator size="large" color="#0D4D12" />
      </View>
    );
  }

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: '#ECE8DD',
      }}
      showsVerticalScrollIndicator={false}
    >
      <Text
        style={{
          fontSize: 22,
          fontWeight: '700',
          color: '#0D4D12',
          textAlign: 'center',
          marginTop: 40,
          marginBottom: 16,
        }}
      >
        Sermões
      </Text>

      {videos.map((video) => {
        const videoId = video.id.videoId;

        return (
          <Pressable
            key={videoId}
            onPress={() =>
              Linking.openURL(
                `https://www.youtube.com/watch?v=${videoId}`
              )
            }
            style={{
              backgroundColor: 'white',
              marginHorizontal: 20,
              marginBottom: 12,
              borderRadius: 16,
              padding: 16,

              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.08,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Image
              source={{
                uri: video.snippet.thumbnails.high.url,
              }}
              resizeMode="cover"
              style={{
                width: '100%',
                height: 135,
                borderRadius: 12,
                marginBottom: 12,
              }}
            />

            <Text
              numberOfLines={2}
              style={{
                fontSize: 13,
                fontWeight: '700',
                color: '#0D4D12',
                lineHeight: 18,
              }}
            >
              {video.snippet.title}
            </Text>

            <Text
              style={{
                marginTop: 4,
                fontSize: 12,
                color: '#777',
              }}
            >
              Assistir no YouTube
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}