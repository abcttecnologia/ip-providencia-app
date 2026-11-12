import { router } from 'expo-router';
import {
  Image,
  Pressable,
  Text,
  View,
} from 'react-native';

type Props = {
  video: any;
};

export default function SermaoCard({
  video,
}: Props) {
  if (!video) return null;

  // Busca o videoId em múltiplas estruturas possíveis da API YouTube
  const videoId =
    video.id?.videoId ??
    video.id ??
    video.snippet?.resourceId?.videoId ??
    video.resourceId?.videoId;

  if (!videoId) return null;

  const thumbnail =
    video.snippet?.thumbnails?.high?.url ??
    video.snippet?.thumbnails?.medium?.url ??
    video.snippet?.thumbnails?.default?.url;

  const titulo = video.snippet?.title ?? video.title;

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/player',
          params: {
            videoId,
            titulo,
          },
        })
      }
      style={{
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,

        flexDirection: 'row',
        alignItems: 'center',

        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
      }}
    >
      <Image
        source={{
          uri: thumbnail,
        }}
        resizeMode="cover"
        style={{
          width: 90,
          height: 50,
          borderRadius: 10,
        }}
      />

      <View
        style={{
          flex: 1,
          marginLeft: 10,
        }}
      >
        <Text
          style={{
            color: '#546B5F',
            fontSize: 9,
            fontWeight: '700',
          }}
        >
          ÚLTIMO SERMÃO
        </Text>

        <Text
          numberOfLines={2}
          style={{
            marginTop: 2,
            fontSize: 10,
            fontWeight: '700',
            color: '#023411',
          }}
        >
          {titulo}
        </Text>
      </View>
    </Pressable>
  );
}
