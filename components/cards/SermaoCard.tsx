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

  const videoId =
    video.id?.videoId ??
    video.snippet?.resourceId?.videoId;

  if (!videoId) return null;

  const thumbnail =
    video.snippet?.thumbnails?.high?.url ??
    video.snippet?.thumbnails?.medium?.url ??
    video.snippet?.thumbnails?.default?.url;

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/player',
          params: {
            videoId,
            titulo: video.snippet.title,
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
          {video.snippet.title}
        </Text>
      </View>
    </Pressable>
  );
}