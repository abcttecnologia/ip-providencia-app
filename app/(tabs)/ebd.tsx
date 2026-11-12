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
import { getMinhaSalaEbd, getSalasEbd } from "../../services/salasEbd";
import type { SalaEbd } from "../../types/firestore";

export default function MinhaEbdScreen() {
  const { user, loading: profileLoading, error, canAccessMemberFeatures } =
    useMemberAccess();
  const [rooms, setRooms] = useState<SalaEbd[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");

  const loadRooms = useCallback(() => {
    const request =
      user?.perfil === "ADMINISTRADOR"
        ? getSalasEbd()
        : getMinhaSalaEbd().then((room) => (room ? [room] : []));

    request
      .then((loadedRooms) => {
        setRooms(loadedRooms);
        setLoadError("");
      })
      .catch((requestError) => {
        console.error("Falha ao carregar a sala da EBD:", requestError);
        setLoadError(
          "Não foi possível carregar as informações da EBD. Tente novamente.",
        );
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, [user]);

  useEffect(() => {
    if (!profileLoading && canAccessMemberFeatures) loadRooms();
  }, [profileLoading, canAccessMemberFeatures, loadRooms]);

  if (profileLoading) {
    return (
      <Screen>
        <AppHeader title="Minha EBD" />
        <ScreenLoader message="Verificando perfil..." />
      </Screen>
    );
  }

  if (!canAccessMemberFeatures) {
    return (
      <MemberAccessNotice
        title="Minha EBD"
        authenticated={Boolean(user)}
        profileError={Boolean(error)}
      />
    );
  }

  if (loading) {
    return (
      <Screen>
        <AppHeader title="Minha EBD" />
        <ScreenLoader message="Carregando salas da EBD..." />
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader title="Minha EBD" />
      <RefreshableScroll
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          loadRooms();
        }}
        contentContainerStyle={styles.content}
      >
        {loadError ? <Text style={styles.errorText}>{loadError}</Text> : null}
        {rooms.length ? (
          rooms.map((room) => <RoomCard key={room.id} room={room} />)
        ) : (
          <EmptyState
            icon="book-outline"
            title="Nenhuma sala vinculada"
            description="A administração da igreja pode vincular você à sua turma da EBD."
          />
        )}
      </RefreshableScroll>
    </Screen>
  );
}

function RoomCard({ room }: { room: SalaEbd }) {
  return (
    <AppCard>
      <Text style={styles.roomName}>{room.nome}</Text>
      {room.descricao ? (
        <Text style={styles.description}>{room.descricao}</Text>
      ) : null}
      {room.faixaEtaria ? (
        <InfoRow label="Faixa etária" value={room.faixaEtaria} />
      ) : null}
      {room.diaSemana ? <InfoRow label="Dia" value={room.diaSemana} /> : null}
      {room.horario ? (
        <InfoRow label="Horário" value={room.horario} />
      ) : null}
    </AppCard>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Text style={styles.info}>
      <Text style={styles.infoLabel}>{label}: </Text>
      {value}
    </Text>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 18,
    paddingBottom: 44,
  },
  roomName: {
    color: "#023411",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 10,
  },
  description: {
    color: "#555",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 8,
  },
  info: {
    color: "#555",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 3,
  },
  infoLabel: {
    color: "#546B5F",
    fontWeight: "700",
  },
  errorText: {
    color: "#B3261E",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 12,
  },
});
