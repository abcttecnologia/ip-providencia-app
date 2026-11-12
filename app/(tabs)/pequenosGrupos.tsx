import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";

import AppCard from "../../components/ui/AppCard";
import AppHeader from "../../components/ui/AppHeader";
import EmptyState from "../../components/ui/EmptyState";
import RefreshableScroll from "../../components/ui/RefreshableScroll";
import Screen from "../../components/ui/Screen";
import ScreenLoader from "../../components/ui/ScreenLoader";
import { useCurrentUserProfile } from "../../hooks/useCurrentUserProfile";
import {
  getMeuPequenoGrupo,
  getPequenosGrupos,
} from "../../services/pequenosGrupos";
import type { PequenoGrupo } from "../../types/firestore";

export default function PequenosGruposScreen() {
  const { user, loading: profileLoading } = useCurrentUserProfile();
  const [groups, setGroups] = useState<PequenoGrupo[]>([]);
  const [myGroup, setMyGroup] = useState<PequenoGrupo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadGroups = useCallback(() => {
    Promise.all([
      getPequenosGrupos(),
      user?.ativo &&
      (user.perfil === "MEMBRO" || user.perfil === "ADMINISTRADOR")
        ? getMeuPequenoGrupo()
        : Promise.resolve(null),
    ])
      .then(([availableGroups, personalGroup]) => {
        setGroups(availableGroups);
        setMyGroup(personalGroup);
        setError("");
      })
      .catch((loadError) => {
        console.error("Falha ao carregar Pequenos Grupos:", loadError);
        setError(
          "Não foi possível carregar os grupos. Verifique sua conexão e tente novamente.",
        );
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, [user]);

  useEffect(() => {
    if (profileLoading) return;
    loadGroups();
  }, [profileLoading, loadGroups]);

  if (profileLoading || loading) {
    return (
      <Screen>
        <AppHeader title="Pequenos Grupos" />
        <ScreenLoader message="Carregando Pequenos Grupos..." />
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader title="Pequenos Grupos" />
      <RefreshableScroll
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          loadGroups();
        }}
        contentContainerStyle={styles.content}
      >
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {user?.ativo &&
        (user.perfil === "MEMBRO" || user.perfil === "ADMINISTRADOR") ? (
          <>
            <Text style={styles.sectionTitle}>Meu Pequeno Grupo</Text>
            {myGroup ? (
              <GroupCard group={myGroup} />
            ) : (
              <EmptyState
                icon="people-outline"
                title="Você ainda não está vinculado a um PG"
                description="Converse com a secretaria para encontrar o grupo certo para você."
              />
            )}
          </>
        ) : null}

        <Text style={styles.sectionTitle}>Encontrar um PG</Text>
        <Text style={styles.intro}>
          Conheça os Pequenos Grupos ativos e encontre um lugar para participar.
        </Text>
        {groups.length ? (
          groups.map((group) => <GroupCard key={group.id} group={group} />)
        ) : (
          <EmptyState
            icon="people-outline"
            title="Nenhum grupo disponível"
            description="Não há Pequenos Grupos ativos no momento."
          />
        )}
      </RefreshableScroll>
    </Screen>
  );
}

function GroupCard({ group }: { group: PequenoGrupo }) {
  return (
    <AppCard>
      <Text style={styles.groupName}>{group.nome}</Text>
      {group.descricao ? (
        <Text style={styles.groupDescription}>{group.descricao}</Text>
      ) : null}
      {group.bairro ? <InfoRow label="Bairro" value={group.bairro} /> : null}
      {group.diaSemana ? (
        <InfoRow label="Dia" value={group.diaSemana} />
      ) : null}
      {group.horario ? (
        <InfoRow label="Horário" value={group.horario} />
      ) : null}
      {group.local ? <InfoRow label="Local" value={group.local} /> : null}
      <Text style={styles.contactHint}>
        Para participar, entre em contato com a igreja.
      </Text>
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
  sectionTitle: {
    color: "#023411",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    marginTop: 8,
  },
  intro: {
    color: "#546B5F",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14,
  },
  groupName: {
    color: "#023411",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  groupDescription: {
    color: "#555",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 10,
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
  contactHint: {
    color: "#1E5631",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 12,
  },
  errorText: {
    color: "#B3261E",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 12,
  },
});
