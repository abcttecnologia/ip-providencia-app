import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text } from "react-native";

import MemberAccessNotice from "../components/member/MemberAccessNotice";
import AppCard from "../components/ui/AppCard";
import AppButton from "../components/ui/AppButton";
import AppHeader from "../components/ui/AppHeader";
import EmptyState from "../components/ui/EmptyState";
import RefreshableScroll from "../components/ui/RefreshableScroll";
import Screen from "../components/ui/Screen";
import ScreenLoader from "../components/ui/ScreenLoader";
import { useCurrentUserProfile } from "../hooks/useCurrentUserProfile";
import {
  getMeusMinisterios,
  getMinisteriosDisponiveis,
  getMinhasSolicitacoesMinisterio,
  solicitarParticipacaoMinisterio,
} from "../services/ministerios";
import type { Ministerio } from "../types/firestore";

export default function MinisteriosScreen() {
  const { user, loading: profileLoading, error } = useCurrentUserProfile();
  const canAccessMemberFeatures = Boolean(user?.ativo);
  const [ministries, setMinistries] = useState<Ministerio[]>([]);
  const [availableMinistries, setAvailableMinistries] = useState<Ministerio[]>(
    [],
  );
  const [requests, setRequests] = useState<
    { ministerioId: string; status: "pendente" | "aprovada" | "recusada" }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");

  function loadMinistries() {
    Promise.all([
      getMeusMinisterios(),
      getMinisteriosDisponiveis(),
      getMinhasSolicitacoesMinisterio(),
    ])
      .then(([loadedMinistries, loadedAvailable, loadedRequests]) => {
        setMinistries(loadedMinistries);
        setAvailableMinistries(loadedAvailable);
        setRequests(loadedRequests);
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

  async function requestMinistry(ministryId: string) {
    try {
      await solicitarParticipacaoMinisterio(ministryId);
      setRequests((current) => [
        ...current.filter((request) => request.ministerioId !== ministryId),
        { ministerioId: ministryId, status: "pendente" },
      ]);
      Alert.alert("Pedido enviado", "A secretaria avaliará sua solicitação.");
    } catch (requestError) {
      console.error("Falha ao solicitar participação em ministério:", requestError);
      Alert.alert(
        "Não foi possível enviar",
        requestError instanceof Error
          ? requestError.message
          : "Tente novamente em alguns instantes.",
      );
    }
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
        <Text style={styles.sectionTitle}>Quero participar</Text>
        {availableMinistries
          .filter(
            (ministry) =>
              !ministries.some((linked) => linked.id === ministry.id) &&
              ministry.id !== "conselho" &&
              ministry.id !== "junta-diaconal",
          )
          .map((ministry) => {
            const request = requests.find(
              (item) => item.ministerioId === ministry.id,
            );
            return (
              <AppCard key={ministry.id}>
                <Text style={styles.name}>{ministry.nome}</Text>
                {request?.status === "pendente" ? (
                  <Text style={styles.pending}>Pedido enviado. Aguarde o contato da secretaria.</Text>
                ) : (
                  <AppButton
                    title="Quero participar"
                    onPress={() => void requestMinistry(ministry.id)}
                  />
                )}
              </AppCard>
            );
          })}
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
  sectionTitle: {
    color: "#023411",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 18,
    marginBottom: 10,
  },
  pending: {
    color: "#6A4B00",
    fontSize: 14,
    lineHeight: 20,
  },
});
