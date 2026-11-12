import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";

import MemberAccessNotice from "../../components/member/MemberAccessNotice";
import AppCard from "../../components/ui/AppCard";
import AppHeader from "../../components/ui/AppHeader";
import EmptyState from "../../components/ui/EmptyState";
import RefreshableScroll from "../../components/ui/RefreshableScroll";
import Screen from "../../components/ui/Screen";
import ScreenLoader from "../../components/ui/ScreenLoader";
import { useMemberAccess } from "../../hooks/useMemberAccess";
import { getFamilias, getMinhaFamilia } from "../../services/familias";
import type { Familia } from "../../types/firestore";

export default function FamiliaScreen() {
  const { user, loading: profileLoading, error, canAccessMemberFeatures } =
    useMemberAccess();
  const [families, setFamilies] = useState<Familia[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");

  const loadFamilies = useCallback(() => {
    const request =
      user?.perfil === "ADMINISTRADOR"
        ? getFamilias()
        : getMinhaFamilia().then((family) => (family ? [family] : []));

    request
      .then((loadedFamilies) => {
        setFamilies(loadedFamilies);
        setLoadError("");
      })
      .catch((requestError) => {
        console.error("Falha ao carregar família:", requestError);
        setLoadError(
          "Não foi possível carregar as informações da família. Tente novamente.",
        );
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, [user]);

  useEffect(() => {
    if (!profileLoading && canAccessMemberFeatures) loadFamilies();
  }, [profileLoading, canAccessMemberFeatures, loadFamilies]);

  if (profileLoading) {
    return (
      <Screen>
        <AppHeader title="Minha Família" />
        <ScreenLoader message="Verificando perfil..." />
      </Screen>
    );
  }

  if (!canAccessMemberFeatures) {
    return (
      <MemberAccessNotice
        title="Minha Família"
        authenticated={Boolean(user)}
        profileError={Boolean(error)}
      />
    );
  }

  if (loading) {
    return (
      <Screen>
        <AppHeader title="Minha Família" />
        <ScreenLoader message="Carregando família..." />
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader title="Minha Família" />
      <RefreshableScroll
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          loadFamilies();
        }}
        contentContainerStyle={styles.content}
      >
        {loadError ? <Text style={styles.errorText}>{loadError}</Text> : null}
        {families.length ? (
          families.map((family) => (
            <AppCard key={family.id}>
              <Text style={styles.name}>{family.nome}</Text>
              <Text style={styles.description}>
                {family.membrosUids.length}{" "}
                {family.membrosUids.length === 1 ? "pessoa vinculada" : "pessoas vinculadas"}
              </Text>
            </AppCard>
          ))
        ) : (
          <EmptyState
            icon="people-outline"
            title="Nenhuma família vinculada"
            description="A administração da igreja pode vincular você a uma família."
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
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 8,
  },
  description: {
    color: "#555",
    fontSize: 14,
  },
  errorText: {
    color: "#B3261E",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 12,
  },
});
