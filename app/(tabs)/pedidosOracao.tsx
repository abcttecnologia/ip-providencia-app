import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text } from "react-native";

import AppInput from "../../components/forms/AppInput";
import FormError from "../../components/forms/FormError";
import AppButton from "../../components/ui/AppButton";
import AppCard from "../../components/ui/AppCard";
import AppHeader from "../../components/ui/AppHeader";
import EmptyState from "../../components/ui/EmptyState";
import RefreshableScroll from "../../components/ui/RefreshableScroll";
import Screen from "../../components/ui/Screen";
import ScreenLoader from "../../components/ui/ScreenLoader";
import { useCurrentUserProfile } from "../../hooks/useCurrentUserProfile";
import {
  createPedidoOracao,
  getMeusPedidosOracao,
  getPedidosDoMeuPg,
} from "../../services/pedidosOracao";
import type { PedidoOracao } from "../../types/firestore";

export default function PedidosOracaoScreen() {
  const { user, loading: profileLoading } = useCurrentUserProfile();
  const [texto, setTexto] = useState("");
  const [compartilharComPg, setCompartilharComPg] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [ownRequests, setOwnRequests] = useState<PedidoOracao[]>([]);
  const [groupRequests, setGroupRequests] = useState<PedidoOracao[]>([]);
  const [loadedFor, setLoadedFor] = useState("");
  const submissionInProgress = useRef(false);
  const requestScope = user
    ? `${user.uid}:${user.perfil}:${user.pequenoGrupoId ?? ""}`
    : "";

  async function loadRequests() {
    if (!user) {
      setOwnRequests([]);
      setGroupRequests([]);
      setRequestsLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const [own, shared] = await Promise.all([
        getMeusPedidosOracao(),
        user.perfil === "MEMBRO" && user.pequenoGrupoId
          ? getPedidosDoMeuPg()
          : Promise.resolve([]),
      ]);
      setOwnRequests(own);
      setGroupRequests(shared);
      setError("");
    } catch (loadError) {
      console.error("Falha ao carregar pedidos de oração:", loadError);
      setError(
        "Não foi possível carregar os pedidos. Verifique sua conexão e tente novamente.",
      );
    } finally {
      setRequestsLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (profileLoading || !user) return;
    let active = true;

    Promise.all([
      getMeusPedidosOracao(),
      user.perfil === "MEMBRO" && user.pequenoGrupoId
        ? getPedidosDoMeuPg()
        : Promise.resolve([]),
    ])
      .then(([own, shared]) => {
        if (!active) return;
        setOwnRequests(own);
        setGroupRequests(shared);
        setLoadedFor(requestScope);
        setError("");
      })
      .catch((loadError) => {
        console.error("Falha ao carregar pedidos de oração:", loadError);
        if (active) {
          setLoadedFor(requestScope);
          setError(
            "Não foi possível carregar os pedidos. Verifique sua conexão e tente novamente.",
          );
        }
      })
      .finally(() => {
        if (!active) return;
        setRequestsLoading(false);
        setRefreshing(false);
      });

    return () => {
      active = false;
    };
  }, [profileLoading, requestScope, user]);

  async function submitRequest() {
    if (submissionInProgress.current) return;
    if (!texto.trim()) {
      setError("Escreva seu pedido antes de enviar.");
      return;
    }

    submissionInProgress.current = true;
    setEnviando(true);
    setError("");
    try {
      await createPedidoOracao({
        texto,
        compartilhadoComPg: compartilharComPg,
      });
      setTexto("");
      setCompartilharComPg(false);
      Alert.alert(
        "Pedido enviado",
        user
          ? "Seu pedido de oração foi enviado."
          : "Seu pedido de oração foi enviado. Como visitante sem login, você não poderá consultar o pedido depois.",
      );
      if (user) await loadRequests();
    } catch (submitError) {
      console.error("Falha ao enviar pedido de oração:", submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Não foi possível enviar o pedido. Verifique sua conexão e tente novamente.",
      );
    } finally {
      submissionInProgress.current = false;
      setEnviando(false);
    }
  }

  if (
    profileLoading ||
    (user && (requestsLoading || loadedFor !== requestScope))
  ) {
    return (
      <Screen>
        <AppHeader title="Pedidos de oração" />
        <ScreenLoader message="Carregando pedidos..." />
      </Screen>
    );
  }

  const visibleOwnRequests = loadedFor === requestScope ? ownRequests : [];
  const visibleGroupRequests = (
    loadedFor === requestScope ? groupRequests : []
  ).filter(
    (request) =>
      !visibleOwnRequests.some((ownRequest) => ownRequest.id === request.id),
  );

  return (
    <Screen>
      <AppHeader title="Pedidos de oração" />
      <RefreshableScroll
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          loadRequests();
        }}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.intro}>
          Compartilhe um motivo de oração. Visitantes também podem enviar um
          pedido sem criar uma conta.
        </Text>

        <AppCard>
          <Text style={styles.sectionTitle}>Enviar pedido</Text>
          <AppInput
            value={texto}
            onChangeText={(value) => {
              setTexto(value);
              setError("");
            }}
            placeholder="Escreva seu pedido de oração"
            multiline
            textAlignVertical="top"
            style={styles.multilineInput}
            editable={!enviando}
            accessibilityLabel="Pedido de oração"
          />

          {user?.ativo &&
          user.perfil === "MEMBRO" &&
          user.pequenoGrupoId ? (
            <Pressable
              onPress={() => setCompartilharComPg((value) => !value)}
              style={styles.checkboxRow}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: compartilharComPg }}
            >
              <Ionicons
                name={compartilharComPg ? "checkbox" : "square-outline"}
                size={22}
                color="#1E5631"
              />
              <Text style={styles.checkboxLabel}>
                Compartilhar com meu Pequeno Grupo
              </Text>
            </Pressable>
          ) : null}

          <FormError message={error} />
          <AppButton
            title={enviando ? "Enviando..." : "Enviar pedido"}
            onPress={submitRequest}
            disabled={enviando}
          />
        </AppCard>

        {user ? (
          <>
            <Text style={styles.listTitle}>Meus pedidos</Text>
            {visibleOwnRequests.length ? (
              visibleOwnRequests.map((request) => (
                <PrayerCard key={request.id} request={request} own />
              ))
            ) : (
              <EmptyState
                icon="heart-outline"
                title="Nenhum pedido ainda"
                description="Os pedidos que você enviar aparecerão aqui."
              />
            )}

            {user.perfil === "MEMBRO" && user.pequenoGrupoId ? (
              <>
                <Text style={styles.listTitle}>Pedidos compartilhados com meu PG</Text>
                {visibleGroupRequests.length ? (
                  visibleGroupRequests.map((request) => (
                    <PrayerCard key={request.id} request={request} />
                  ))
                ) : (
                  <Text style={styles.emptyText}>
                    Não há pedidos compartilhados com seu grupo.
                  </Text>
                )}
              </>
            ) : null}
          </>
        ) : (
          <Text style={styles.privacyNote}>
            Pedidos enviados sem login não ficam disponíveis para consulta
            posterior.
          </Text>
        )}
      </RefreshableScroll>
    </Screen>
  );
}

function PrayerCard({
  request,
  own = false,
}: {
  request: PedidoOracao;
  own?: boolean;
}) {
  return (
    <AppCard>
      {own ? (
        <Text style={styles.badge}>Meu pedido</Text>
      ) : (
        <Text style={styles.badge}>Compartilhado com este PG</Text>
      )}
      <Text style={styles.requestText}>{request.texto}</Text>
      <Text style={styles.requestDate}>
        {request.status === "respondido" ? "Respondido" : "Em oração"}
      </Text>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 18,
    paddingBottom: 44,
  },
  intro: {
    color: "#546B5F",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16,
    textAlign: "center",
  },
  sectionTitle: {
    color: "#023411",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 12,
  },
  multilineInput: {
    minHeight: 120,
    paddingTop: 14,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  checkboxLabel: {
    flex: 1,
    marginLeft: 8,
    color: "#333",
    fontSize: 14,
  },
  listTitle: {
    color: "#023411",
    fontSize: 17,
    fontWeight: "700",
    marginTop: 14,
    marginBottom: 12,
  },
  badge: {
    color: "#1E5631",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
  },
  requestText: {
    color: "#333",
    fontSize: 15,
    lineHeight: 23,
  },
  requestDate: {
    color: "#777",
    fontSize: 12,
    marginTop: 12,
    textAlign: "right",
  },
  emptyText: {
    color: "#666",
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 16,
    textAlign: "center",
  },
  privacyNote: {
    color: "#777",
    fontSize: 13,
    lineHeight: 20,
    paddingHorizontal: 10,
    textAlign: "center",
  },
});
