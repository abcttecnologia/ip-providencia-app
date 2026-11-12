import { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";

import MemberAccessNotice from "../components/member/MemberAccessNotice";
import AppCard from "../components/ui/AppCard";
import AppHeader from "../components/ui/AppHeader";
import EmptyState from "../components/ui/EmptyState";
import RefreshableScroll from "../components/ui/RefreshableScroll";
import Screen from "../components/ui/Screen";
import ScreenLoader from "../components/ui/ScreenLoader";
import { useMemberAccess } from "../hooks/useMemberAccess";
import { getMeusMinisterios } from "../services/ministerios";
import type { Ministerio } from "../types/firestore";

export default function MinisteriosScreen() {
  const { user, loading: profileLoading, error, canAccessMemberFeatures } =
    useMemberAccess();
  const [ministries, setMinistries] = useState<Ministerio[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");

  function loadMinistries() {
    getMeusMinisterios()
      .then((loadedMinistries) => {
        setMinistries(loadedMinistries);
        setLoadError("");
      })
      .catch((requestError) => {
        console.error("Falha ao carregar ministérios:", requestError);
        setLoadError(
          "Não foi possível carregar os ministérios. Verifique sua conexão e tente novamente.",
        );
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }

  useEffect(() => {
    if (!profileLoading && canAccessMemberFeatures) loadMinistries();
  }, [profileLoading, canAccessMemberFeatures, user]);

  if (profileLoading) {
    return (
      <Screen>
        <AppHeader title="Ministérios" />
        <ScreenLoader message="Verificando perfil..." />
      </Screen>
    );
  }

  if (!canAccessMemberFeatures) {
    return (
      <MemberAccessNotice
        title="Ministérios"
        authenticated={Boolean(user)}
        profileError={Boolean(error)}
      />
    );
  }

  if (loading) {
    return (
      <Screen>
        <AppHeader title="Ministérios" />
        <ScreenLoader message="Carregando ministérios..." />
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader title="Ministérios" />
      <RefreshableScroll
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          loadMinistries();
        }}
        contentContainerStyle={styles.content}
      >
        {loadError ? <Text style={styles.errorText}>{loadError}</Text> : null}
        {ministries.length ? (
          ministries.map((ministry) => (
            <AppCard key={ministry.id}>
              <Text style={styles.name}>{ministry.nome}</Text>
              {ministry.descricao ? (
                <Text style={styles.description}>{ministry.descricao}</Text>
              ) : null}
            </AppCard>
          ))
        ) : (
          <EmptyState
            icon="people-circle-outline"
            title="Nenhum ministério vinculado"
            description="Se você acredita que deveria ver um ministério, fale com a administração da igreja."
          />
        )}
      </RefreshableScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 18,
    paddingBottom: 44,
  },
  name: {
    color: "#023411",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  description: {
    color: "#555",
    fontSize: 14,
    lineHeight: 21,
  },
  errorText: {
    color: "#B3261E",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 12,
  },
});
