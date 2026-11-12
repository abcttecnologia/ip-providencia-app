import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import AppInput from "../components/forms/AppInput";
import FormError from "../components/forms/FormError";
import AppButton from "../components/ui/AppButton";
import AppCard from "../components/ui/AppCard";
import AppHeader from "../components/ui/AppHeader";
import EmptyState from "../components/ui/EmptyState";
import RefreshableScroll from "../components/ui/RefreshableScroll";
import Screen from "../components/ui/Screen";
import ScreenLoader from "../components/ui/ScreenLoader";
import { useCurrentUserProfile } from "../hooks/useCurrentUserProfile";
import {
  createPedidoOracao,
  getMeusPedidosOracao,
  getPedidosDoMeuPg,
} from "../services/pedidosOracao";
import type { PedidoOracao } from "../types/firestore";

const statusTabs: {
  status: PedidoOracao["status"];
  label: string;
}[] = [
  { status: "aberto", label: "Em acompanhamento" },
  { status: "respondido", label: "Respondidos" },
  { status: "arquivado", label: "Arquivados" },
];

const statusLabels: Record<PedidoOracao["status"], string> = {
  aberto: "Em acompanhamento",
  respondido: "Respondido",
  arquivado: "Arquivado",
};

export default function PedidosOracaoScreen() {
  const { user, loading: profileLoading } = useCurrentUserProfile();
  const [titulo, setTitulo] = useState("");
  const [situacao, setSituacao] = useState("");
  const [compartilharComPg, setCompartilharComPg] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [ownRequests, setOwnRequests] = useState<PedidoOracao[]>([]);
  const [groupRequests, setGroupRequests] = useState<PedidoOracao[]>([]);
  const [selectedStatus, setSelectedStatus] =
    useState<PedidoOracao["status"]>("aberto");
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
    if (!titulo.trim() || !situacao.trim()) {
      setError("Preencha o título e o pedido.");
      return;
    }

    submissionInProgress.current = true;
    setEnviando(true);
    setError("");
    try {
      await createPedidoOracao({
        titulo,
        texto: situacao,
        compartilhadoComPg: compartilharComPg,
      });
      setTitulo("");
      setSituacao("");
      setCompartilharComPg(false);
      Alert.alert(
        "Pedido enviado",
        "Estaremos orando por você.",
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
  const filteredOwnRequests = visibleOwnRequests.filter(
    (request) => request.status === selectedStatus,
  );
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
          <Text style={styles.label}>Título do pedido</Text>
          <AppInput
            value={titulo}
            onChangeText={(value) => {
              setTitulo(value);
              setError("");
            }}
            placeholder="Dê um título ao pedido"
            maxLength={100}
            editable={!enviando}
            accessibilityLabel="Título do pedido de oração"
          />
          <Text style={styles.label}>Conte a situação</Text>
          <AppInput
            value={situacao}
            onChangeText={(value) => {
              setSituacao(value);
              setError("");
            }}
            placeholder="Descreva como podemos orar por você"
            maxLength={2000}
            multiline
            textAlignVertical="top"
            style={styles.multilineInput}
            editable={!enviando}
            accessibilityLabel="Situação do pedido de oração"
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
          {!user ? (
            <Text style={styles.privacyNote}>
              Para acompanhar seus pedidos, entre na sua conta.
            </Text>
          ) : null}
        </AppCard>

        {user ? (
          <>
            <Text style={styles.listTitle}>Meus pedidos</Text>
            <View style={styles.statusTabs}>
              {statusTabs.map((tab) => (
                <Pressable
                  key={tab.status}
                  accessibilityRole="tab"
                  accessibilityState={{
                    selected: selectedStatus === tab.status,
                  }}
                  onPress={() => setSelectedStatus(tab.status)}
                  style={[
                    styles.statusTab,
                    selectedStatus === tab.status && styles.statusTabSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusTabText,
                      selectedStatus === tab.status &&
                        styles.statusTabTextSelected,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            {filteredOwnRequests.length ? (
              filteredOwnRequests.map((request) => (
                <PrayerCard key={request.id} request={request} own />
              ))
            ) : (
              <EmptyState
                icon="heart-outline"
                title="Nenhum pedido nesta aba"
                description="Seus pedidos aparecerão aqui conforme o status."
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
        ) : null}
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
      <Text style={styles.requestTitle}>{request.titulo}</Text>
      <Text style={styles.requestText}>{request.texto}</Text>
      <Text style={styles.requestDate}>
        {formatRequestDate(request.criadoEm)} · {statusLabels[request.status]}
      </Text>
    </AppCard>
  );
}

function formatRequestDate(value: PedidoOracao["criadoEm"]): string {
  if (!value) return "Data indisponível";
  const date = value instanceof Date ? value : value.toDate();
  return date.toLocaleDateString("pt-BR");
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
  label: {
    color: "#546B5F",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 5,
  },
  multilineInput: {
    height: 140,
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
  statusTabs: {
    flexDirection: "row",
    marginBottom: 12,
  },
  statusTab: {
    flex: 1,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderBottomWidth: 2,
    borderBottomColor: "#D8DFD7",
  },
  statusTabSelected: {
    borderBottomColor: "#1E5631",
  },
  statusTabText: {
    color: "#546B5F",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  statusTabTextSelected: {
    color: "#023411",
    fontWeight: "700",
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
  requestTitle: {
    color: "#023411",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
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
