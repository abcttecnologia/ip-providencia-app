import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import AppCard from "../../components/ui/AppCard";
import AppHeader from "../../components/ui/AppHeader";
import RefreshableScroll from "../../components/ui/RefreshableScroll";
import Screen from "../../components/ui/Screen";
import ScreenLoader from "../../components/ui/ScreenLoader";
import { useCurrentUserProfile } from "../../hooks/useCurrentUserProfile";
import { getAvisos } from "../../services/avisos";
import { getEventos } from "../../services/eventos";

type DashboardStats = {
  avisos: number;
  eventosAtivos: number;
};

export default function AdminDashboardScreen() {
  const { user } = useCurrentUserProfile();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      const [noticeResult, events] = await Promise.all([
        getAvisos(),
        getEventos(),
      ]);

      setStats({
        avisos: noticeResult.data.length,
        eventosAtivos: events.filter((event) => event.ativo).length,
      });
      setError("");
    } catch (loadError) {
      console.error("Falha ao carregar o painel administrativo:", loadError);
      setError("Não foi possível carregar o resumo. Tente novamente.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, [loadDashboard]),
  );

  function refreshDashboard() {
    setRefreshing(true);
    void loadDashboard();
  }

  if (loading) {
    return (
      <Screen>
        <AppHeader title="Painel administrativo" showBack={false} />
        <ScreenLoader message="Carregando o painel..." />
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader title="Painel administrativo" showBack={false} />
      <RefreshableScroll
        refreshing={refreshing}
        onRefresh={refreshDashboard}
        contentContainerStyle={styles.content}
      >
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeIcon}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#FFF" />
          </View>
          <Text style={styles.eyebrow}>ÁREA ADMINISTRATIVA</Text>
          <Text style={styles.welcomeTitle}>
            Olá, {user?.nome?.split(" ")[0] ?? "Administrador"}
          </Text>
          <Text style={styles.welcomeText}>
            Acesse os recursos de gestão da IP Providência.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Visão geral</Text>
        {error ? (
          <AppCard style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              onPress={refreshDashboard}
              accessibilityRole="button"
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Tentar novamente</Text>
            </Pressable>
          </AppCard>
        ) : (
          <View style={styles.statsRow}>
            <StatCard
              icon="megaphone-outline"
              label="Avisos cadastrados"
              value={stats?.avisos ?? 0}
            />
            <StatCard
              icon="calendar-outline"
              label="Eventos ativos"
              value={stats?.eventosAtivos ?? 0}
            />
          </View>
        )}

        <Text style={styles.sectionTitle}>Gestão da igreja</Text>
        <ActionCard
          icon="newspaper-outline"
          title="Avisos e eventos"
          description="Publique, edite e organize os conteúdos do aplicativo."
          onPress={() => router.push("/admin/conteudo")}
        />
        <ActionCard
          icon="people-outline"
          title="Gerenciar pessoas"
          description="Atualize perfis e vínculos com ministérios, PGs e EBD."
          onPress={() => router.push("/perfil")}
        />
      </RefreshableScroll>
    </Screen>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: number;
}) {
  return (
    <AppCard style={styles.statCard}>
      <Ionicons name={icon} size={22} color="#1E5631" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </AppCard>
  );
}

function ActionCard({
  icon,
  title,
  description,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}
    >
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={23} color="#1E5631" />
      </View>
      <View style={styles.actionCopy}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#66736A" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  welcomeCard: {
    backgroundColor: "#023411",
    borderRadius: 22,
    marginBottom: 24,
    padding: 22,
  },
  welcomeIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.14)",
    marginBottom: 16,
  },
  eyebrow: {
    color: "#C9D8C8",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  welcomeTitle: {
    color: "#FFF",
    fontSize: 25,
    fontWeight: "700",
    marginTop: 6,
  },
  welcomeText: {
    color: "#E1E9DE",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  sectionTitle: {
    color: "#023411",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    minHeight: 126,
    marginBottom: 16,
  },
  statValue: {
    color: "#023411",
    fontSize: 26,
    fontWeight: "700",
    marginTop: 10,
  },
  statLabel: {
    color: "#66736A",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 18,
    marginBottom: 12,
    padding: 16,
  },
  actionIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#E8EEE6",
  },
  actionCopy: {
    flex: 1,
    marginHorizontal: 12,
  },
  actionTitle: {
    color: "#023411",
    fontSize: 14,
    fontWeight: "700",
  },
  actionDescription: {
    color: "#66736A",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  pressed: {
    opacity: 0.75,
  },
  errorCard: {
    marginBottom: 24,
  },
  errorText: {
    color: "#B3261E",
    fontSize: 14,
  },
  retryButton: {
    alignSelf: "flex-start",
    paddingTop: 12,
  },
  retryText: {
    color: "#1E5631",
    fontSize: 14,
    fontWeight: "700",
  },
});
