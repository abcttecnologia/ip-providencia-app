import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import AppButton from '../components/ui/AppButton';
import AppCard from '../components/ui/AppCard';
import AppHeader from '../components/ui/AppHeader';
import EmptyState from '../components/ui/EmptyState';
import RefreshableScroll from '../components/ui/RefreshableScroll';
import Screen from '../components/ui/Screen';
import ScreenLoader from '../components/ui/ScreenLoader';
import { useCurrentUserProfile } from '../hooks/useCurrentUserProfile';
import { getPedidosDoMeuPg } from '../services/pedidosOracao';
import {
  getMeuPequenoGrupo,
  getPendingPgRequests,
  getPgAttendance,
  getPgParticipants,
  getMyPgRequests,
  getPequenosGrupos,
  removePgParticipant,
  requestToJoinPg,
  savePgAttendance,
  updatePgRequestStatus,
} from '../services/pequenosGrupos';
import type {
  ParticipantePg,
  PequenoGrupo,
  PresencaPg,
  SolicitacaoPg,
} from '../types/firestore';

function todayInput() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function nextMeetingLabel(group: PequenoGrupo) {
  if (!group.diaSemana) return 'Próximo encontro: data a combinar';

  const weekdays = [
    'domingo',
    'segunda',
    'terca',
    'quarta',
    'quinta',
    'sexta',
    'sabado',
  ];
  const normalizedDay = group.diaSemana
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const targetDay = weekdays.findIndex((day) => normalizedDay.startsWith(day));
  if (targetDay < 0) {
    return `Encontro: ${group.diaSemana}${group.horario ? ` • ${group.horario}` : ''}`;
  }

  const nextDate = new Date();
  const daysUntil = (targetDay - nextDate.getDay() + 7) % 7;
  nextDate.setDate(nextDate.getDate() + daysUntil);
  if (daysUntil === 0 && group.horario) {
    const time = group.horario.match(/(\d{1,2})(?::|h)?(\d{2})?/i);
    if (time && Number(time[1]) <= 23) {
      const meetingHour = Number(time[1]);
      const meetingMinute = Number(time[2] ?? 0);
      if (
        nextDate.getHours() > meetingHour ||
        (nextDate.getHours() === meetingHour &&
          nextDate.getMinutes() >= meetingMinute)
      ) {
        nextDate.setDate(nextDate.getDate() + 7);
      }
    }
  }

  const dateLabel = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(nextDate);
  return `Próximo encontro: ${dateLabel}${group.horario ? ` • ${group.horario}` : ''}`;
}

export default function PequenosGruposScreen() {
  const { user, loading: profileLoading } = useCurrentUserProfile();
  const [groups, setGroups] = useState<PequenoGrupo[]>([]);
  const [myGroup, setMyGroup] = useState<PequenoGrupo | null>(null);
  const [myRequests, setMyRequests] = useState<SolicitacaoPg[]>([]);
  const [participants, setParticipants] = useState<ParticipantePg[]>([]);
  const [prayerRequests, setPrayerRequests] = useState<
    Awaited<ReturnType<typeof getPedidosDoMeuPg>>
  >([]);
  const [pendingRequests, setPendingRequests] = useState<SolicitacaoPg[]>([]);
  const [attendance, setAttendance] = useState<PresencaPg | null>(null);
  const [presentUids, setPresentUids] = useState<string[]>([]);
  const [visitors, setVisitors] = useState('0');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  const loadGroups = useCallback(async () => {
    try {
      const [availableGroups, personalGroup, requests] = await Promise.all([
        getPequenosGrupos(),
        user?.ativo ? getMeuPequenoGrupo() : Promise.resolve(null),
        getMyPgRequests(),
      ]);
      setGroups(availableGroups);
      setMyGroup(personalGroup);
      setMyRequests(requests);

      if (!personalGroup || !user?.uid) {
        setParticipants([]);
        setPrayerRequests([]);
        setPendingRequests([]);
        setAttendance(null);
        setError('');
        return;
      }

      const isLeader = personalGroup.liderUids?.includes(user.uid) === true;
      const [roster, prayers, pending, todayAttendance] = await Promise.all([
        getPgParticipants(personalGroup.id),
        getPedidosDoMeuPg(personalGroup.id),
        isLeader
          ? getPendingPgRequests(personalGroup.id)
          : Promise.resolve([] as SolicitacaoPg[]),
        isLeader
          ? getPgAttendance(personalGroup.id, todayInput())
          : Promise.resolve(null),
      ]);
      setParticipants(roster);
      setPrayerRequests(prayers);
      setPendingRequests(pending);
      setAttendance(todayAttendance);
      setPresentUids(todayAttendance?.presentes ?? []);
      setVisitors(String(todayAttendance?.visitantes ?? 0));
      setError('');
    } catch (loadError) {
      console.error('Falha ao carregar Pequenos Grupos:', loadError);
      setError(
        'Não foi possível carregar os dados do PG. Verifique sua conexão e suas permissões.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (profileLoading) return;
    void Promise.resolve().then(loadGroups);
  }, [profileLoading, loadGroups]);

  async function handleJoin(group: PequenoGrupo) {
    setBusyId(group.id);
    try {
      await requestToJoinPg(group.id);
      await loadGroups();
      Alert.alert('Solicitação enviada', 'O líder do grupo receberá seu pedido.');
    } catch (requestError) {
      Alert.alert(
        'Não foi possível solicitar',
        requestError instanceof Error
          ? requestError.message
          : 'Tente novamente mais tarde.',
      );
    } finally {
      setBusyId('');
    }
  }

  async function handleRequest(
    request: SolicitacaoPg,
    status: 'aprovada' | 'recusada',
  ) {
    setBusyId(request.id);
    try {
      await updatePgRequestStatus(request, status);
      await loadGroups();
      Alert.alert(
        status === 'aprovada' ? 'Participante aprovado' : 'Solicitação recusada',
        status === 'aprovada'
          ? `${request.nome} foi vinculado ao grupo.`
          : `A solicitação de ${request.nome} foi recusada.`,
      );
    } catch (actionError) {
      Alert.alert(
        'Não foi possível atualizar',
        actionError instanceof Error
          ? actionError.message
          : 'Verifique sua conexão e tente novamente.',
      );
    } finally {
      setBusyId('');
    }
  }

  function confirmRemoval(participant: ParticipantePg) {
    Alert.alert(
      'Remover do Pequeno Grupo?',
      `${participant.nome} deixará de aparecer entre os participantes.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            setBusyId(participant.uid);
            void removePgParticipant(participant.uid)
              .then(loadGroups)
              .catch((removeError: unknown) => {
                Alert.alert(
                  'Não foi possível remover',
                  removeError instanceof Error
                    ? removeError.message
                    : 'Verifique sua conexão e tente novamente.',
                );
              })
              .finally(() => setBusyId(''));
          },
        },
      ],
    );
  }

  async function handleSaveAttendance() {
    if (!myGroup) return;
    setBusyId('presenca');
    try {
      await savePgAttendance(
        myGroup.id,
        todayInput(),
        presentUids,
        Number(visitors || 0),
      );
      setAttendance({
        id: `${myGroup.id}_${todayInput()}`,
        grupoId: myGroup.id,
        data: todayInput(),
        presentes: presentUids,
        visitantes: Number(visitors || 0),
        registradoPor: user?.uid ?? '',
      });
      Alert.alert('Presença salva', 'O encontro de hoje foi registrado.');
    } catch (saveError) {
      Alert.alert(
        'Não foi possível salvar',
        saveError instanceof Error
          ? saveError.message
          : 'Verifique sua conexão e tente novamente.',
      );
    } finally {
      setBusyId('');
    }
  }

  if (profileLoading || loading) {
    return (
      <Screen>
        <AppHeader title="Pequenos Grupos" />
        <ScreenLoader message="Carregando Pequenos Grupos..." />
      </Screen>
    );
  }

  const isLeader =
    Boolean(myGroup && user?.uid && myGroup.liderUids?.includes(user.uid));
  const requestByGroup = new Map(
    myRequests.map((request) => [request.grupoId, request]),
  );
  const canRequest = user?.ativo && user.perfil === 'MEMBRO' && !user.pequenoGrupoId;

  return (
    <Screen>
      <AppHeader title="Pequenos Grupos" />
      <RefreshableScroll
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          void loadGroups();
        }}
        contentContainerStyle={styles.content}
      >
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {myGroup ? (
          <>
            <Text style={styles.sectionTitle}>Meu PG</Text>
            <AppCard>
              <Text style={styles.groupName}>{myGroup.nome}</Text>
              <Text style={styles.nextMeeting}>{nextMeetingLabel(myGroup)}</Text>
              {myGroup.local ? (
                <InfoRow label="Local" value={myGroup.local} />
              ) : null}
              {myGroup.bairro ? (
                <InfoRow label="Bairro" value={myGroup.bairro} />
              ) : null}
            </AppCard>

            <Text style={styles.sectionTitle}>Participantes</Text>
            <AppCard>
              {participants.length ? (
                participants.map((participant) => (
                  <View key={participant.uid} style={styles.participantRow}>
                    {participant.fotoUrl ? (
                      <Image
                        source={{ uri: participant.fotoUrl }}
                        style={styles.avatar}
                      />
                    ) : (
                      <View style={[styles.avatar, styles.avatarFallback]}>
                        <Text style={styles.avatarInitial}>
                          {participant.nome.slice(0, 1).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.participantName}>{participant.nome}</Text>
                    {isLeader && participant.uid !== user?.uid ? (
                      <Pressable
                        onPress={() => confirmRemoval(participant)}
                        disabled={busyId === participant.uid}
                        accessibilityRole="button"
                        accessibilityLabel={`Remover ${participant.nome} do grupo`}
                      >
                        <Text style={styles.removeText}>
                          {busyId === participant.uid ? 'Removendo...' : 'Remover'}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                ))
              ) : (
                <Text style={styles.mutedText}>
                  A lista de participantes ainda não está disponível.
                </Text>
              )}
            </AppCard>

            <Text style={styles.sectionTitle}>Pedidos de oração compartilhados</Text>
            {prayerRequests.length ? (
              prayerRequests.map((request) => (
                <AppCard key={request.id}>
                  <Text style={styles.groupName}>{request.titulo}</Text>
                  <Text style={styles.requestText}>{request.texto}</Text>
                </AppCard>
              ))
            ) : (
              <EmptyState
                icon="heart-outline"
                title="Nenhum pedido compartilhado"
                description="Os pedidos compartilhados com este PG aparecerão aqui."
              />
            )}

            {isLeader ? (
              <>
                <Text style={styles.sectionTitle}>Pedidos para participar</Text>
                {pendingRequests.length ? (
                  pendingRequests.map((request) => (
                    <AppCard key={request.id}>
                      <Text style={styles.groupName}>{request.nome}</Text>
                      <Text style={styles.mutedText}>Solicitação pendente</Text>
                      <View style={styles.actionRow}>
                        <Pressable
                          style={[styles.actionButton, styles.approveButton]}
                          disabled={busyId === request.id}
                          onPress={() => void handleRequest(request, 'aprovada')}
                        >
                          <Text style={styles.approveText}>Aprovar</Text>
                        </Pressable>
                        <Pressable
                          style={[styles.actionButton, styles.rejectButton]}
                          disabled={busyId === request.id}
                          onPress={() => void handleRequest(request, 'recusada')}
                        >
                          <Text style={styles.rejectText}>Recusar</Text>
                        </Pressable>
                      </View>
                    </AppCard>
                  ))
                ) : (
                  <EmptyState
                    icon="person-add-outline"
                    title="Nenhum pedido pendente"
                    description="Novas solicitações dos membros aparecerão aqui."
                  />
                )}

                <Text style={styles.sectionTitle}>Presença de hoje</Text>
                <AppCard>
                  <Text style={styles.mutedText}>
                    {attendance
                      ? `Registro de ${attendance.data} — você pode atualizar a lista.`
                      : `Marque quem participou do encontro de ${todayInput()}.`}
                  </Text>
                  {participants.map((participant) => {
                    const checked = presentUids.includes(participant.uid);
                    return (
                      <Pressable
                        key={participant.uid}
                        onPress={() =>
                          setPresentUids((current) =>
                            checked
                              ? current.filter((uid) => uid !== participant.uid)
                              : [...current, participant.uid],
                          )
                        }
                        style={styles.checkRow}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            checked && styles.checkboxChecked,
                          ]}
                        >
                          {checked ? <Text style={styles.checkmark}>✓</Text> : null}
                        </View>
                        <Text style={styles.participantName}>{participant.nome}</Text>
                      </Pressable>
                    );
                  })}
                  <Text style={styles.label}>Visitantes sem conta</Text>
                  <TextInput
                    value={visitors}
                    onChangeText={(value) => setVisitors(value.replace(/\D/g, ''))}
                    keyboardType="number-pad"
                    style={styles.visitorInput}
                    accessibilityLabel="Quantidade de visitantes sem conta"
                  />
                  <View style={styles.saveButton}>
                    <AppButton
                      title={busyId === 'presenca' ? 'Salvando...' : 'Salvar presença'}
                      onPress={() => void handleSaveAttendance()}
                      disabled={busyId === 'presenca'}
                    />
                  </View>
                </AppCard>
              </>
            ) : null}
          </>
        ) : null}

        <Text style={styles.sectionTitle}>Encontrar um PG</Text>
        <Text style={styles.intro}>
          Conheça os Pequenos Grupos ativos e solicite participação pelo app.
        </Text>
        {groups.length ? (
          groups.map((group) => {
            const request = requestByGroup.get(group.id);
            const isMyGroup = myGroup?.id === group.id;
            return (
              <AppCard key={group.id}>
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
                {canRequest && !isMyGroup ? (
                  <View style={styles.saveButton}>
                    <AppButton
                      title={
                        busyId === group.id
                          ? 'Enviando...'
                          : request?.status === 'pendente'
                            ? 'Solicitação enviada'
                            : request?.status === 'recusada'
                              ? 'Solicitação recusada'
                              : 'Quero participar'
                      }
                      onPress={() => void handleJoin(group)}
                      disabled={
                        busyId === group.id ||
                        request?.status === 'pendente' ||
                        request?.status === 'recusada'
                      }
                    />
                  </View>
                ) : !user ? (
                  <Text style={styles.contactHint}>
                    Entre na sua conta como membro para solicitar participação.
                  </Text>
                ) : !canRequest && !isMyGroup ? (
                  <Text style={styles.contactHint}>
                    A solicitação de participação está disponível para membros sem vínculo a outro PG.
                  </Text>
                ) : null}
              </AppCard>
            );
          })
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
    color: '#023411',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
  },
  intro: {
    color: '#546B5F',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14,
  },
  groupName: {
    color: '#023411',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  groupDescription: {
    color: '#555',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 10,
  },
  nextMeeting: {
    color: '#1E5631',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  info: {
    color: '#555',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 3,
  },
  infoLabel: {
    color: '#546B5F',
    fontWeight: '700',
  },
  contactHint: {
    color: '#1E5631',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 12,
  },
  participantRow: {
    alignItems: 'center',
    borderBottomColor: '#E8EEE9',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 10,
    minHeight: 54,
  },
  avatar: {
    borderRadius: 18,
    height: 36,
    width: 36,
  },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: '#E8F2EB',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#1E5631',
    fontSize: 15,
    fontWeight: '700',
  },
  participantName: {
    color: '#33443A',
    flex: 1,
    fontSize: 14,
  },
  removeText: {
    color: '#B3261E',
    fontSize: 12,
    fontWeight: '600',
    padding: 8,
  },
  mutedText: {
    color: '#718078',
    fontSize: 13,
    lineHeight: 20,
  },
  requestText: {
    color: '#526058',
    fontSize: 14,
    lineHeight: 21,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  actionButton: {
    alignItems: 'center',
    borderRadius: 10,
    flex: 1,
    padding: 12,
  },
  approveButton: {
    backgroundColor: '#E8F2EB',
  },
  approveText: {
    color: '#1E5631',
    fontWeight: '700',
  },
  rejectButton: {
    backgroundColor: '#FAECEC',
  },
  rejectText: {
    color: '#B3261E',
    fontWeight: '700',
  },
  checkRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    minHeight: 44,
  },
  checkbox: {
    alignItems: 'center',
    borderColor: '#9BAC9F',
    borderRadius: 5,
    borderWidth: 1,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  checkboxChecked: {
    backgroundColor: '#1E5631',
    borderColor: '#1E5631',
  },
  checkmark: {
    color: '#FFF',
    fontWeight: '700',
  },
  label: {
    color: '#33443A',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 16,
  },
  visitorInput: {
    borderColor: '#DCE5DE',
    borderRadius: 10,
    borderWidth: 1,
    color: '#33443A',
    fontSize: 16,
    marginTop: 7,
    padding: 12,
  },
  saveButton: {
    marginTop: 14,
  },
  errorText: {
    color: '#B3261E',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 12,
  },
});
