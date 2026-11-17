import { useEffect, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";

export default function SermoesSkeleton() {
  const [opacity] = useState(() => new Animated.Value(0.45));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <View style={styles.featured} />
      <View style={styles.line} />
      <View style={styles.shortLine} />
      <View style={styles.cards}>
        {[1, 2, 3].map((item) => (
          <View key={item} style={styles.card}>
            <View style={styles.cardImage} />
            <View style={styles.cardLine} />
            <View style={styles.cardShortLine} />
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  featured: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 22,
    backgroundColor: "#D5DAD5",
  },
  line: {
    width: "42%",
    height: 17,
    marginTop: 27,
    borderRadius: 5,
    backgroundColor: "#D5DAD5",
  },
  shortLine: {
    width: "25%",
    height: 11,
    marginTop: 7,
    borderRadius: 5,
    backgroundColor: "#D5DAD5",
  },
  cards: {
    flexDirection: "row",
    gap: 12,
    marginTop: 15,
  },
  card: {
    width: 194,
    gap: 8,
  },
  cardImage: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 16,
    backgroundColor: "#D5DAD5",
  },
  cardLine: {
    width: "88%",
    height: 12,
    borderRadius: 4,
    backgroundColor: "#D5DAD5",
  },
  cardShortLine: {
    width: "48%",
    height: 9,
    borderRadius: 4,
    backgroundColor: "#D5DAD5",
  },
});
