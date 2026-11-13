const { initializeApp } = require('firebase-admin/app');
const { FieldValue, getFirestore } = require('firebase-admin/firestore');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const {
  onDocumentCreated,
  onDocumentWritten,
} = require('firebase-functions/v2/firestore');
const logger = require('firebase-functions/logger');

initializeApp();
const db = getFirestore();

exports.notifyPgLeaders = onDocumentCreated(
  { document: 'solicitacoesPg/{solicitacaoId}', retry: true },
  async (event) => {
    const request = event.data?.data();
    if (!request || request.status !== 'pendente') return;
    if (typeof request.grupoId !== 'string') {
      logger.warn('Solicitação de PG sem grupo válido', {
        solicitacaoId: event.params.solicitacaoId,
      });
      return;
    }

    const groupSnapshot = await db
      .collection('pequenosGrupos')
      .doc(request.grupoId)
      .get();
    const group = groupSnapshot.data();
    if (!group) {
      logger.warn('Grupo da solicitação não encontrado', {
        solicitacaoId: event.params.solicitacaoId,
        grupoId: request.grupoId,
      });
      return;
    }
    const leaderUids = group.liderUids;
    if (!Array.isArray(leaderUids) || leaderUids.length === 0) return;

    const tokenSnapshots = await Promise.all(
      [...new Set(leaderUids)].map((uid) =>
        db.collection('pushTokens').where('uid', '==', uid).get(),
      ),
    );
    const tokens = tokenSnapshots
      .flatMap((snapshot) =>
        snapshot.docs
          .filter((token) => token.data().ativo === true)
          .map((token) => ({ token: token.id, ref: token.ref })),
      )
      .filter(
        (entry, index, entries) =>
          entries.findIndex((candidate) => candidate.token === entry.token) ===
          index,
      );
    if (tokens.length === 0) return;

    for (let offset = 0; offset < tokens.length; offset += 100) {
      const batch = tokens.slice(offset, offset + 100);
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          batch.map(({ token }) => ({
            to: token,
            title: 'Novo pedido para participar do PG',
            body: `${request.nome} quer participar de ${group.nome ?? 'seu grupo'}.`,
            data: {
              screen: 'pequenosGrupos',
              grupoId: request.grupoId,
            },
          })),
        ),
      });

      if (!response.ok) {
        throw new Error(`Expo Push retornou HTTP ${response.status}.`);
      }

      const result = await response.json();
      const tickets = Array.isArray(result.data) ? result.data : [];
      const failedTickets = tickets.filter(
        (ticket) => ticket.status === 'error',
      );
      if (failedTickets.length > 0) {
        logger.warn('Expo Push rejeitou algumas notificações', {
          solicitacaoId: event.params.solicitacaoId,
          errors: failedTickets.map((ticket) => ticket.message),
        });
      }
      const invalidTokens = tickets.flatMap((ticket, index) =>
        ticket.status === 'error' &&
        ticket.details?.error === 'DeviceNotRegistered'
          ? [batch[index]]
          : [],
      );
      await Promise.all(
        invalidTokens.map(({ ref }) =>
          ref.update({
            ativo: false,
            atualizadoEm: FieldValue.serverTimestamp(),
          }),
        ),
      );
    }

    logger.info('Push enviado aos líderes do PG', {
      grupoId: request.grupoId,
      quantidade: tokens.length,
    });
  },
);

exports.syncPgRoster = onDocumentWritten(
  { document: 'users/{uid}', retry: true },
  async (event) => {
    const before = event.data?.before.exists ? event.data.before.data() : null;
    const after = event.data?.after.exists ? event.data.after.data() : null;
    const uid = event.params.uid;
    const previousGroupId = memberGroupId(before);
    const nextGroupId = memberGroupId(after);

    if (previousGroupId === nextGroupId && !nextGroupId) return;

    const participantRef = (groupId) =>
      db
        .collection('pequenosGrupos')
        .doc(groupId)
        .collection('participantes')
        .doc(uid);
    const participantMetaRef = (groupId) =>
      db
        .collection('pequenosGrupos')
        .doc(groupId)
        .collection('participantesMeta')
        .doc(uid);

    if (previousGroupId && previousGroupId !== nextGroupId) {
      await Promise.all([
        participantRef(previousGroupId).delete(),
        participantMetaRef(previousGroupId).delete(),
      ]);
    }
    if (!nextGroupId || !after) return;

    const nextParticipantRef = participantRef(nextGroupId);
    await nextParticipantRef.set({
      nome: typeof after.nome === 'string' ? after.nome : 'Nome não informado',
      fotoUrl: typeof after.fotoUrl === 'string' ? after.fotoUrl : '',
    });
    const metaRef = participantMetaRef(nextGroupId);
    const existingMeta =
      previousGroupId === nextGroupId ? await metaRef.get() : null;
    if (!existingMeta?.exists) {
      await metaRef.set({
        ingressoEm:
          after.pequenoGrupoDesde ??
          (previousGroupId !== nextGroupId
            ? after.atualizadoEm ?? FieldValue.serverTimestamp()
            : FieldValue.serverTimestamp()),
      });
    }
  },
);

exports.ensurePgRoster = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Entre na sua conta.');
  }

  const groupId = request.data?.grupoId;
  if (typeof groupId !== 'string' || groupId.length === 0) {
    throw new HttpsError('invalid-argument', 'Informe o Pequeno Grupo.');
  }

  const [userSnapshot, groupSnapshot] = await Promise.all([
    db.collection('users').doc(request.auth.uid).get(),
    db.collection('pequenosGrupos').doc(groupId).get(),
  ]);
  const user = userSnapshot.data();
  const group = groupSnapshot.data();
  const isLeader =
    Array.isArray(group?.liderUids) &&
    group.liderUids.includes(request.auth.uid);
  const isMember =
    user?.ativo === true &&
    user.perfil === 'MEMBRO' &&
    user.pequenoGrupoId === groupId;

  if (!groupSnapshot.exists || (!isLeader && !isMember)) {
    throw new HttpsError('permission-denied', 'Você não participa deste PG.');
  }

  const members = await db
    .collection('users')
    .where('pequenoGrupoId', '==', groupId)
    .get();
  const validMembers = members.docs.filter(
    (member) =>
      member.data().ativo === true &&
      member.data().perfil === 'MEMBRO',
  );
  const participantRefs = validMembers.map((member) =>
    groupSnapshot.ref.collection('participantes').doc(member.id),
  );
  const participantMetaRefs = validMembers.map((member) =>
    groupSnapshot.ref.collection('participantesMeta').doc(member.id),
  );
  const [participantSnapshots, participantMetaSnapshots] = await Promise.all([
    Promise.all(participantRefs.map((ref) => ref.get())),
    Promise.all(participantMetaRefs.map((ref) => ref.get())),
  ]);
  const missingParticipants = validMembers
    .map((member, index) => ({
      member,
      ref: participantRefs[index],
      metaRef: participantMetaRefs[index],
      participantExists: participantSnapshots[index].exists,
      metaExists: participantMetaSnapshots[index].exists,
    }))
    .filter(
      ({ participantExists, metaExists }) =>
        !participantExists || !metaExists,
    );

  for (let offset = 0; offset < missingParticipants.length; offset += 450) {
    const batch = db.batch();
    for (const {
      member,
      ref,
      metaRef,
      participantExists,
      metaExists,
    } of missingParticipants.slice(offset, offset + 450)) {
      const data = member.data();
      if (!participantExists) {
        batch.set(ref, {
          nome: typeof data.nome === 'string' ? data.nome : 'Nome não informado',
          fotoUrl: typeof data.fotoUrl === 'string' ? data.fotoUrl : '',
        });
      }
      if (!metaExists) {
        batch.set(metaRef, { ingressoEm: FieldValue.serverTimestamp() });
      }
    }
    await batch.commit();
  }

  return { participantes: validMembers.length };
});

function memberGroupId(user) {
  return user?.ativo === true &&
    user.perfil === 'MEMBRO' &&
    typeof user.pequenoGrupoId === 'string'
    ? user.pequenoGrupoId
    : null;
}
