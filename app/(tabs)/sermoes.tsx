import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import SermaoCard from "../../components/sermoes/SermaoCard";
import SermaoDestaque from "../../components/sermoes/SermaoDestaque";
import SermoesSkeleton from "../../components/sermoes/SermoesSkeleton";
import SerieCarrossel from "../../components/sermoes/SerieCarrossel";
import type {
  SermonSeries,
  SermonVideo,
} from "../../components/sermoes/types";
import AppHeader from "../../components/ui/AppHeader";
import OfflineBanner from "../../components/ui/OfflineBanner";
import RefreshableScroll from "../../components/ui/RefreshableScroll";
import Screen from "../../components/ui/Screen";
import {
  getPlaylistVideos,
  getPlaylists,
  getVideoDetailsBatch,
} from "../../services/youtube";

export default function SermoesScreen() {
  const [series, setSeries] = useState<SermonSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedSerie, setSelectedSerie] = useState<string | null>(null);
  const [serieAberta, setSerieAberta] = useState<SermonSeries | null>(null);

  const carregarSermoes = useCallback(async () => {
    try {
      const resultadoPlaylists = await getPlaylists();
      setOffline(resultadoPlaylists.offline || false);

      if (!resultadoPlaylists.data?.length) {
        setSeries([]);
        return;
      }

      const playlistsOrdenadas = ordenarPlaylists(resultadoPlaylists.data);
      const resultados: { offline: boolean; secao: SermonSeries | null }[] =
        await Promise.all(
        playlistsOrdenadas.map(async (playlist): Promise<{
          offline: boolean;
          secao: SermonSeries | null;
        }> => {
          try {
            const resultadoVideos = await getPlaylistVideos(playlist.id);
            const videos = (resultadoVideos.data ?? []) as Record<string, unknown>[];
            if (!videos.length) {
              return { offline: resultadoVideos.offline, secao: null };
            }

            const normalizedVideos = videos
              .map((video: Record<string, unknown>) => {
                const snippet = video.snippet as SermonVideo["snippet"] | undefined;
                const videoId = snippet?.resourceId?.videoId ?? String(video.id ?? "");
                if (!videoId || !snippet?.title) return null;
                return {
                  ...video,
                  id: videoId,
                  snippet,
                } as SermonVideo;
              })
              .filter((video): video is SermonVideo => video !== null);
            return {
              offline: resultadoVideos.offline,
              secao: normalizedVideos.length
                ? {
                    id: playlist.id,
                    titulo: playlist.snippet.title,
                    videos: normalizedVideos,
                  }
                : null,
            };
          } catch (error) {
            console.error("Erro ao carregar uma série de sermões:", error);
            return { offline: true, secao: null };
          }
          }),
        );

      const allVideos = resultados.flatMap((result) => result.secao?.videos ?? []);
      const detailsResult = await getVideoDetailsBatch(
        allVideos.map((video) => video.id),
      );
      const details = detailsResult.data;
      const hydratedSeries: SermonSeries[] = resultados.flatMap((result) => {
        if (!result.secao) return [];
        return [{
            ...result.secao,
            videos: result.secao.videos.map((video: SermonVideo) => ({
              ...video,
              snippet: {
                ...video.snippet,
                publishedAt:
                  details[video.id]?.snippet?.publishedAt ??
                  video.snippet.publishedAt,
              },
              contentDetails: details[video.id]?.contentDetails,
            })),
          }];
      });

      setOffline(
        resultadoPlaylists.offline ||
          resultados.some((result) => result.offline) ||
          detailsResult.offline,
      );
      setSeries(hydratedSeries);
    } catch (error) {
      console.error("Erro ao carregar sermões:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void carregarSermoes();
    }, [carregarSermoes]),
  );

  const filteredSeries = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
    return series
      .filter((section) => !selectedSerie || section.id === selectedSerie)
      .map((section) => ({
        ...section,
        videos: section.videos.filter((video) =>
          video.snippet.title.toLocaleLowerCase("pt-BR").includes(normalizedSearch),
        ),
      }))
      .filter((section) => section.videos.length > 0);
  }, [search, selectedSerie, series]);

  const latestVideo = useMemo(
    () =>
      filteredSeries
        .flatMap((section) => section.videos)
        .sort(
          (left, right) =>
            publishedTime(right) - publishedTime(left),
        )[0],
    [filteredSeries],
  );

  function atualizar() {
    setRefreshing(true);
    void carregarSermoes();
  }

  function abrirVideo(video: SermonVideo) {
    const videoId = video.snippet.resourceId?.videoId || video.id;
    if (!videoId) return;

    router.push({
      pathname: "/player",
      params: { videoId, titulo: video.snippet.title },
    });
  }

  function selecionarSerie(serieId: string | null) {
    setSelectedSerie(serieId);
    setSerieAberta(null);
  }

  if (loading) {
    return (
      <Screen>
        <AppHeader title="Sermões" showBack={false} />
        <SermoesSkeleton />
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader title="Sermões" showBack={false} />
      <OfflineBanner visible={offline} />
      <RefreshableScroll
        refreshing={refreshing}
        onRefresh={atualizar}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.intro}>
          Acompanhe nossas séries de sermões e cresça no conhecimento das Escrituras.
        </Text>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color="#6C7E72" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar sermão ou passagem"
            placeholderTextColor="#8B9A90"
            style={styles.search}
            accessibilityLabel="Buscar sermão ou passagem"
            returnKeyType="search"
          />
          {search ? (
            <Pressable
              onPress={() => setSearch("")}
              accessibilityRole="button"
              accessibilityLabel="Limpar busca"
            >
              <Ionicons name="close-circle" size={18} color="#8B9A90" />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.chips}>
          <Pressable
            onPress={() => selecionarSerie(null)}
            style={[styles.chip, !selectedSerie && styles.chipSelected]}
            accessibilityRole="button"
            accessibilityState={{ selected: !selectedSerie }}
          >
            <Text style={[styles.chipText, !selectedSerie && styles.chipTextSelected]}>
              Todos
            </Text>
          </Pressable>
          {series.map((section) => (
            <Pressable
              key={section.id}
              onPress={() => selecionarSerie(section.id)}
              style={[styles.chip, selectedSerie === section.id && styles.chipSelected]}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedSerie === section.id }}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedSerie === section.id && styles.chipTextSelected,
                ]}
              >
                {nomeSerie(section.titulo)}
              </Text>
            </Pressable>
          ))}
        </View>

        {serieAberta ? (
          <View>
            <Pressable
              onPress={() => setSerieAberta(null)}
              style={styles.backToSeries}
              accessibilityRole="button"
              accessibilityLabel="Voltar para as séries"
            >
              <Ionicons name="arrow-back" size={17} color="#397455" />
              <Text style={styles.backToSeriesText}>Todas as séries</Text>
            </Pressable>
            <Text style={styles.listTitle}>{serieAberta.titulo}</Text>
            <Text style={styles.listCount}>
              {serieAberta.videos.length} mensagens
            </Text>
            <View style={styles.verticalList}>
              {serieAberta.videos.map((video) => (
                <View key={video.id} style={styles.verticalItem}>
                  <SermaoCard
                    video={video}
                    vertical
                    onPress={() => abrirVideo(video)}
                  />
                </View>
              ))}
            </View>
          </View>
        ) : latestVideo ? (
          <>
            <SermaoDestaque
              video={latestVideo}
              onPress={() => abrirVideo(latestVideo)}
            />
            {filteredSeries.map((section) => (
              <SerieCarrossel
                key={section.id}
                series={section}
                onPressVideo={abrirVideo}
                onSeeAll={() => setSerieAberta(section)}
              />
            ))}
          </>
        ) : (
          <View style={styles.empty}>
            <Ionicons name="cloud-offline-outline" size={38} color="#7C8D82" />
            <Text style={styles.emptyTitle}>
              {offline ? "Você parece estar offline." : "Nenhum sermão encontrado."}
            </Text>
            <Text style={styles.emptyText}>
              {search
                ? "Tente buscar por outro título ou passagem."
                : "Não encontramos sermões disponíveis no momento."}
            </Text>
            {!search ? (
              <Pressable onPress={atualizar} style={styles.retry}>
                <Text style={styles.retryText}>Tentar novamente</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      </RefreshableScroll>
    </Screen>
  );
}

function publishedTime(video: SermonVideo) {
  const time = video.snippet.publishedAt
    ? new Date(video.snippet.publishedAt).getTime()
    : 0;
  return Number.isNaN(time) ? 0 : time;
}

function nomeSerie(title: string) {
  return title.replace(/S[eé]rie em /i, "").trim();
}

function ordenarPlaylists(playlists: { id: string; snippet: { title: string } }[]) {
  const prioridade = [
    "Série em ATOS",
    "Série em SAMUEL",
    "Panorama Antigo Testamento",
    "Panorama Novo Testamento",
  ];
  const normalizar = (t: string) =>
    t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  return [...playlists].sort((a, b) => {
    const tA = a.snippet.title;
    const tB = b.snippet.title;
    const idxA = prioridade.findIndex((p) => normalizar(p) === normalizar(tA));
    const idxB = prioridade.findIndex((p) => normalizar(p) === normalizar(tB));
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return tA.localeCompare(tB);
  });
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 36,
  },
  intro: {
    marginHorizontal: 24,
    marginTop: 2,
    marginBottom: 17,
    color: "#546B5F",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 14,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: "#D8E1D9",
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
  },
  search: {
    flex: 1,
    minHeight: 45,
    paddingHorizontal: 9,
    color: "#023411",
    fontSize: 13,
  },
  chips: {
    flexDirection: "row",
    gap: 8,
    paddingLeft: 16,
    paddingRight: 16,
    marginBottom: 22,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#D8E1D9",
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
  },
  chipSelected: {
    borderColor: "#023411",
    backgroundColor: "#023411",
  },
  chipText: {
    color: "#61736A",
    fontSize: 12,
    fontWeight: "700",
  },
  chipTextSelected: {
    color: "#FFFFFF",
  },
  backToSeries: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 14,
  },
  backToSeriesText: {
    color: "#397455",
    fontSize: 13,
    fontWeight: "700",
  },
  listTitle: {
    marginHorizontal: 16,
    color: "#023411",
    fontSize: 21,
    fontWeight: "800",
  },
  listCount: {
    marginHorizontal: 16,
    marginTop: 4,
    color: "#78897E",
    fontSize: 12,
  },
  verticalList: {
    gap: 12,
    marginTop: 16,
    marginHorizontal: 16,
  },
  verticalItem: {
    width: "100%",
  },
  empty: {
    alignItems: "center",
    marginHorizontal: 24,
    paddingVertical: 52,
  },
  emptyTitle: {
    marginTop: 13,
    color: "#546B5F",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyText: {
    maxWidth: 290,
    marginTop: 7,
    color: "#7D8D83",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  retry: {
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 9,
    backgroundColor: "#023411",
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
