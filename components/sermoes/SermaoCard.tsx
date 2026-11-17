import { Image } from "expo-image";
import { useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { SermonVideo } from "./types";

interface SermaoCardProps {
  video: SermonVideo;
  onPress: () => void;
  vertical?: boolean;
}

export function thumbnailUrl(video: SermonVideo) {
  return (
    video.snippet.thumbnails?.maxres?.url ??
    video.snippet.thumbnails?.high?.url ??
    video.snippet.thumbnails?.medium?.url
  );
}

export function formatSermonDate(value?: string) {
  if (!value) return "Data não informada";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data não informada";
  const parts = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).formatToParts(date);
  const day = parts.find((part) => part.type === "day")?.value;
  const month = parts
    .find((part) => part.type === "month")
    ?.value.replace(".", "");
  const year = parts.find((part) => part.type === "year")?.value;
  return day && month && year ? `${day} ${month} ${year}` : "Data não informada";
}

export function formatSermonDuration(value?: string) {
  if (!value) return "Duração indisponível";
  const match = value.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "Duração indisponível";
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  if (hours > 0) return `${hours}h${minutes ? ` ${minutes}min` : ""}`;
  if (minutes > 0) return `${minutes} min`;
  return `${seconds} seg`;
}

export default function SermaoCard({
  video,
  onPress,
  vertical = false,
}: SermaoCardProps) {
  const [scale] = useState(() => new Animated.Value(1));
  const image = thumbnailUrl(video);
  const date = formatSermonDate(video.snippet.publishedAt);
  const duration = formatSermonDuration(video.contentDetails?.duration);

  function animateTo(value: number) {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 24,
      bounciness: 4,
    }).start();
  }

  return (
    <Animated.View style={[vertical ? styles.vertical : styles.card, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => animateTo(0.97)}
        onPressOut={() => animateTo(1)}
        accessibilityRole="button"
        accessibilityLabel={`${video.snippet.title}, ${date}`}
        style={vertical ? styles.verticalPressable : undefined}
      >
        <View style={[styles.imageWrap, vertical && styles.verticalImage]}>
          <Image
            source={image ? { uri: image } : undefined}
            style={styles.image}
            contentFit="cover"
            cachePolicy="disk"
            transition={180}
          />
          <View style={styles.duration}>
            <Text style={styles.durationText}>{duration}</Text>
          </View>
        </View>
        <View style={styles.copy}>
          <Text numberOfLines={2} style={styles.title}>
            {video.snippet.title}
          </Text>
          <Text style={styles.date}>{date}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 194,
    marginRight: 12,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    shadowColor: "#023411",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  vertical: {
    width: "100%",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    shadowColor: "#023411",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  verticalPressable: {
    flexDirection: "row",
  },
  imageWrap: {
    position: "relative",
    aspectRatio: 16 / 9,
    backgroundColor: "#D8DDD7",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  verticalImage: {
    width: 132,
    flexShrink: 0,
  },
  duration: {
    position: "absolute",
    right: 7,
    bottom: 7,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor: "rgba(0, 0, 0, 0.72)",
  },
  durationText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  copy: {
    padding: 10,
  },
  title: {
    minHeight: 34,
    color: "#023411",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 17,
  },
  date: {
    marginTop: 6,
    color: "#75847B",
    fontSize: 11,
  },
});
