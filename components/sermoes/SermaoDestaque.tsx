import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import {
  formatSermonDate,
  formatSermonDuration,
  thumbnailUrl,
} from "./SermaoCard";
import type { SermonVideo } from "./types";

interface SermaoDestaqueProps {
  video: SermonVideo;
  onPress: () => void;
}

export default function SermaoDestaque({
  video,
  onPress,
}: SermaoDestaqueProps) {
  const [scale] = useState(() => new Animated.Value(1));
  const image = thumbnailUrl(video);
  const date = formatSermonDate(video.snippet.publishedAt);
  const duration = formatSermonDuration(video.contentDetails?.duration);

  return (
    <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={() =>
          Animated.spring(scale, {
            toValue: 0.985,
            useNativeDriver: true,
            speed: 24,
            bounciness: 4,
          }).start()
        }
        onPressOut={() =>
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 24,
            bounciness: 4,
          }).start()
        }
        accessibilityRole="button"
        accessibilityLabel={`${video.snippet.title}, ${date}`}
      >
        <View style={styles.imageWrap}>
          <Image
            source={image ? { uri: image } : undefined}
            style={styles.image}
            contentFit="cover"
            cachePolicy="disk"
            transition={220}
          />
          <View style={styles.scrim} />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>MAIS RECENTE</Text>
          </View>
          <View style={styles.content}>
            <Text numberOfLines={2} style={styles.title}>
              {video.snippet.title}
            </Text>
            <View style={styles.metadata}>
              <Text style={styles.metadataText}>{date}</Text>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.metadataText}>{duration}</Text>
            </View>
          </View>
          <View style={styles.play}>
            <Ionicons name="play" size={23} color="#023411" />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    shadowColor: "#023411",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 5,
  },
  imageWrap: {
    aspectRatio: 16 / 9,
    backgroundColor: "#BFC8C0",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  scrim: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    height: "58%",
    backgroundColor: "rgba(0, 25, 12, 0.78)",
  },
  badge: {
    position: "absolute",
    top: 13,
    left: 13,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 7,
    backgroundColor: "#D5AA42",
  },
  badgeText: {
    color: "#12351F",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  content: {
    position: "absolute",
    right: 62,
    bottom: 16,
    left: 14,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 23,
  },
  metadata: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
  },
  metadataText: {
    color: "#D9E5DC",
    fontSize: 11,
  },
  dot: {
    marginHorizontal: 6,
    color: "#D5AA42",
    fontSize: 13,
  },
  play: {
    position: "absolute",
    right: 14,
    bottom: 15,
    width: 43,
    height: 43,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "#D5AA42",
  },
});
