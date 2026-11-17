import { Ionicons } from "@expo/vector-icons";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import SermaoCard from "./SermaoCard";
import type { SermonSeries } from "./types";

interface SerieCarrosselProps {
  series: SermonSeries;
  onPressVideo: (video: SermonSeries["videos"][number]) => void;
  onSeeAll: () => void;
}

export default function SerieCarrossel({
  series,
  onPressVideo,
  onSeeAll,
}: SerieCarrosselProps) {
  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <View style={styles.headingCopy}>
          <Text style={styles.title}>{series.titulo}</Text>
          <Text style={styles.count}>
            {series.videos.length} {series.videos.length === 1 ? "mensagem" : "mensagens"}
          </Text>
        </View>
        <Pressable
          onPress={onSeeAll}
          accessibilityRole="button"
          accessibilityLabel={`Ver todas as mensagens de ${series.titulo}`}
          style={styles.seeAll}
        >
          <Text style={styles.seeAllText}>Ver tudo</Text>
          <Ionicons name="chevron-forward" size={14} color="#397455" />
        </Pressable>
      </View>
      <FlatList
        horizontal
        data={series.videos}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <SermaoCard video={item} onPress={() => onPressVideo(item)} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 25,
  },
  heading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginBottom: 11,
  },
  headingCopy: {
    flex: 1,
  },
  title: {
    color: "#023411",
    fontSize: 17,
    fontWeight: "800",
  },
  count: {
    marginTop: 3,
    color: "#78897E",
    fontSize: 11,
  },
  seeAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingVertical: 7,
    paddingLeft: 8,
  },
  seeAllText: {
    color: "#397455",
    fontSize: 12,
    fontWeight: "700",
  },
  list: {
    paddingLeft: 16,
    paddingRight: 4,
  },
});
