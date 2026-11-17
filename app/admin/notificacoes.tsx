import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import AppInput from "../../components/forms/AppInput";
import AppButton from "../../components/ui/AppButton";
import AppCard from "../../components/ui/AppCard";
import AppHeader from "../../components/ui/AppHeader";
import RefreshableScroll from "../../components/ui/RefreshableScroll";
import Screen from "../../components/ui/Screen";
import {
  getNotificationRecipientCount,
  sendPushNotification,
  type PushAudience,
} from "../../services/notificacoes";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../services/firebase";

const audiences: { value: PushAudience; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "membros", label: "Membros" },
  { value: "ministerio", label: "Um ministério" },
  { value: "pg", label: "Um PG" },
];

export default function SendNotificationsScreen() {
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [publico, setPublico] = useState<PushAudience>("todos");
  const [alvoId, setAlvoId] = useState("");
  const [targets, setTargets] = useState<{ id: string; nome: string }[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    void loadTargets();
  }, [publico]);

  async function loadTargets() {
    setAlvoId("");
    if (publico === "ministerio") {
      const snapshot = await getDocs(
        query(collection(db, "ministerios"), where("ativo", "==", true)),
      );
      setTargets(snapshot.docs.map((item) => ({
        id: item.id,
        nome: String(item.data().nome ?? item.id),
      })));
    } else if (publico === "pg") {
      const snapshot = await getDocs(
        query(collection(db, "pequenosGrupos"), where("ativo", "==", true)),
      );
      setTargets(snapshot.docs.map((item) => ({
        id: item.id,
        nome: String(item.data().nome ?? item.id),
      })));
    } else {
      setTargets([]);
    }
  }

  async function confirmSend() {
    if (sending) return;
    if (!titulo.trim() || !mensagem.trim()) {
      Alert.alert("Preencha os dados", "Informe título e mensagem.");
      return;
    }
    if ((publico === "ministerio" || publico === "pg") && !alvoId) {
      Alert.alert("Escolha o público", "Selecione o ministério ou PG.");
      return;
    }

    try {
      setSending(true);
      const count = await getNotificationRecipientCount(publico, alvoId || null);
      Alert.alert(
        "Confirmar envio",
        `Enviar para ${count} ${count === 1 ? "pessoa" : "pessoas"}?`,
        [
          { text: "Cancelar", style: "cancel", onPress: () => setSending(false) },
          {
            text: "Enviar",
            onPress: () => void doSend(),
          },
        ],
      );
    } catch (error) {
      setSending(false);
      Alert.alert("Não foi possível preparar o envio", error instanceof Error ? error.message : "Tente novamente.");
    }
  }

  async function doSend() {
    try {
      const result = await sendPushNotification({
        titulo,
        mensagem,
        publico,
        alvoId: alvoId || null,
        screen: "inicio",
      });
      Alert.alert(
        "Envio concluído",
        `${result.sucesso} enviadas, ${result.falhas} falhas, ${result.total} pessoas no público.`,
      );
      setTitulo("");
      setMensagem("");
    } catch (error) {
      Alert.alert("Não foi possível enviar", error instanceof Error ? error.message : "Tente novamente.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Screen>
      <AppHeader title="Enviar notificação" />
      <RefreshableScroll
        refreshing={false}
        onRefresh={() => {}}
        contentContainerStyle={styles.content}
      >
        <AppCard>
          <Text style={styles.label}>Título</Text>
          <AppInput value={titulo} onChangeText={setTitulo} editable={!sending} />
          <Text style={styles.label}>Mensagem</Text>
          <AppInput
            value={mensagem}
            onChangeText={setMensagem}
            multiline
            textAlignVertical="top"
            style={styles.message}
            editable={!sending}
          />
          <Text style={styles.label}>Público</Text>
          <View style={styles.chips}>
            {audiences.map((audience) => (
              <Pressable
                key={audience.value}
                onPress={() => setPublico(audience.value)}
                style={[styles.chip, publico === audience.value && styles.selected]}
                disabled={sending}
              >
                <Text style={[styles.chipText, publico === audience.value && styles.selectedText]}>
                  {audience.label}
                </Text>
              </Pressable>
            ))}
          </View>
          {(publico === "ministerio" || publico === "pg") ? (
            <>
              <Text style={styles.label}>
                {publico === "ministerio" ? "Ministério" : "Pequeno Grupo"}
              </Text>
              {targets.map((target) => (
                <Pressable
                  key={target.id}
                  onPress={() => setAlvoId(target.id)}
                  style={[styles.target, alvoId === target.id && styles.targetSelected]}
                  disabled={sending}
                >
                  <Ionicons
                    name={alvoId === target.id ? "checkmark-circle" : "ellipse-outline"}
                    size={20}
                    color="#1E5631"
                  />
                  <Text style={styles.targetText}>{target.nome}</Text>
                </Pressable>
              ))}
            </>
          ) : null}
          <AppButton
            title={sending ? "Preparando..." : "Enviar notificação"}
            onPress={confirmSend}
            disabled={sending}
          />
        </AppCard>
      </RefreshableScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  label: { color: "#023411", fontSize: 13, fontWeight: "700", marginTop: 14, marginBottom: 7 },
  message: { height: 110 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: "#CBD7CF", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  selected: { backgroundColor: "#023411", borderColor: "#023411" },
  chipText: { color: "#1E5631", fontSize: 12, fontWeight: "700" },
  selectedText: { color: "#FFFFFF" },
  target: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, padding: 10, marginBottom: 6 },
  targetSelected: { backgroundColor: "#E8F2EB" },
  targetText: { color: "#023411", fontWeight: "700" },
});
