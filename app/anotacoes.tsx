import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
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
  createAnotacao,
  deleteAnotacao,
  getMinhasAnotacoes,
  updateAnotacao,
  type AnotacaoInput,
} from "../services/anotacoes";
import type { Anotacao } from "../types/firestore";

export default function AnotacoesScreen() {
  const { user, loading: profileLoading } = useCurrentUserProfile();
  const [notes, setNotes] = useState<Anotacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [referenciaBiblica, setReferenciaBiblica] = useState("");
  const savingInProgress = useRef(false);
  const [loadedForUid, setLoadedForUid] = useState("");

  function loadNotes() {
    getMinhasAnotacoes()
      .then(setNotes)
      .catch((loadError) => {
        console.error("Falha ao carregar anotações:", loadError);
        setError("Não foi possível carregar suas anotações. Tente novamente.");
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }

  useEffect(() => {
    if (profileLoading || !user) return;
    let active = true;

    getMinhasAnotacoes()
      .then((loadedNotes) => {
        if (active) {
          setNotes(loadedNotes);
          setLoadedForUid(user.uid);
        }
      })
      .catch((loadError) => {
        console.error("Falha ao carregar anotações:", loadError);
        if (active) {
          setLoadedForUid(user.uid);
          setError("Não foi possível carregar suas anotações. Tente novamente.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [profileLoading, user]);

  function clearForm() {
    setEditingId(null);
    setTitulo("");
    setConteudo("");
    setReferenciaBiblica("");
    setError("");
  }

  function editNote(note: Anotacao) {
    setEditingId(note.id);
    setTitulo(note.titulo);
    setConteudo(note.conteudo);
    setReferenciaBiblica(note.referenciaBiblica ?? "");
    setError("");
  }

  async function saveNote() {
    if (savingInProgress.current) return;
    if (!titulo.trim() || !conteudo.trim()) {
      setError("Informe o título e o conteúdo da anotação.");
      return;
    }

    savingInProgress.current = true;
    setSaving(true);
    setError("");
    const note: AnotacaoInput = {
      titulo: titulo.trim(),
      conteudo: conteudo.trim(),
      referenciaBiblica: referenciaBiblica.trim(),
    };

    try {
      if (editingId) {
        await updateAnotacao(editingId, note);
      } else {
        await createAnotacao(note);
      }
      clearForm();
      loadNotes();
    } catch (saveError) {
      console.error("Falha ao salvar anotação:", saveError);
      setError(
        "Não foi possível salvar. Verifique sua conexão e tente novamente.",
      );
    } finally {
      savingInProgress.current = false;
      setSaving(false);
    }
  }

  function confirmDelete(note: Anotacao) {
    Alert.alert(
      "Excluir anotação?",
      `“${note.titulo}” será removida permanentemente.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => void removeNote(note.id),
        },
      ],
    );
  }

  async function removeNote(id: string) {
    try {
      await deleteAnotacao(id);
      if (editingId === id) clearForm();
      loadNotes();
    } catch (deleteError) {
      console.error("Falha ao excluir anotação:", deleteError);
      Alert.alert(
        "Não foi possível excluir",
        "Verifique sua conexão e tente novamente.",
      );
    }
  }

  if (profileLoading) {
    return (
      <Screen>
        <AppHeader title="Minhas anotações" />
        <ScreenLoader message="Carregando suas anotações..." />
      </Screen>
    );
  }

  if (!user) {
    return (
      <Screen>
        <AppHeader title="Minhas anotações" />
        <EmptyState
          icon="lock-closed-outline"
          title="Entre para continuar"
          description="Suas anotações são privadas e só ficam disponíveis na sua conta."
        />
        <View style={styles.loginButton}>
          <AppButton
            title="Ir para entrar"
            onPress={() => router.replace("/login")}
          />
        </View>
      </Screen>
    );
  }

  if (loading || loadedForUid !== user.uid) {
    return (
      <Screen>
        <AppHeader title="Minhas anotações" />
        <ScreenLoader message="Carregando suas anotações..." />
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader title="Minhas anotações" />
      <RefreshableScroll
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          loadNotes();
        }}
        contentContainerStyle={styles.content}
      >
        <AppCard>
          <Text style={styles.sectionTitle}>
            {editingId ? "Editar anotação" : "Nova anotação"}
          </Text>
          <Text style={styles.label}>Título</Text>
          <AppInput
            value={titulo}
            onChangeText={setTitulo}
            editable={!saving}
          />
          <Text style={styles.label}>Referência bíblica (opcional)</Text>
          <AppInput
            value={referenciaBiblica}
            onChangeText={setReferenciaBiblica}
            editable={!saving}
          />
          <Text style={styles.label}>Anotação</Text>
          <AppInput
            value={conteudo}
            onChangeText={setConteudo}
            multiline
            textAlignVertical="top"
            style={styles.multilineInput}
            editable={!saving}
          />
          <FormError message={error} />
          <AppButton
            title={saving ? "Salvando..." : editingId ? "Salvar alterações" : "Salvar anotação"}
            onPress={saveNote}
            disabled={saving}
          />
          {editingId ? (
            <Pressable onPress={clearForm} style={styles.cancelEdit}>
              <Text style={styles.linkText}>Cancelar edição</Text>
            </Pressable>
          ) : null}
        </AppCard>

        <Text style={styles.listTitle}>Anotações salvas</Text>
        {notes.length === 0 ? (
          <EmptyState
            icon="document-text-outline"
            title="Nenhuma anotação"
            description="Suas anotações particulares aparecerão aqui."
          />
        ) : (
          notes.map((note) => (
            <AppCard key={note.id}>
              {note.referenciaBiblica ? (
                <Text style={styles.reference}>{note.referenciaBiblica}</Text>
              ) : null}
              <Text style={styles.noteTitle}>{note.titulo}</Text>
              <Text style={styles.noteContent}>{note.conteudo}</Text>
              <View style={styles.noteActions}>
                <Pressable
                  onPress={() => editNote(note)}
                  accessibilityRole="button"
                  accessibilityLabel={`Editar ${note.titulo}`}
                  style={styles.noteAction}
                >
                  <Ionicons name="create-outline" size={20} color="#1E5631" />
                  <Text style={styles.linkText}>Editar</Text>
                </Pressable>
                <Pressable
                  onPress={() => confirmDelete(note)}
                  accessibilityRole="button"
                  accessibilityLabel={`Excluir ${note.titulo}`}
                  style={styles.noteAction}
                >
                  <Ionicons name="trash-outline" size={20} color="#B3261E" />
                  <Text style={styles.deleteText}>Excluir</Text>
                </Pressable>
              </View>
            </AppCard>
          ))
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
  sectionTitle: {
    color: "#023411",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 14,
  },
  label: {
    color: "#546B5F",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 5,
  },
  multilineInput: {
    minHeight: 150,
    paddingTop: 14,
  },
  cancelEdit: {
    alignItems: "center",
    paddingTop: 14,
  },
  linkText: {
    color: "#1E5631",
    fontWeight: "700",
    marginLeft: 6,
  },
  listTitle: {
    color: "#023411",
    fontSize: 17,
    fontWeight: "700",
    marginVertical: 12,
  },
  reference: {
    color: "#1E5631",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },
  noteTitle: {
    color: "#023411",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  noteContent: {
    color: "#444",
    fontSize: 14,
    lineHeight: 22,
  },
  noteActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 14,
  },
  noteAction: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    marginLeft: 12,
  },
  deleteText: {
    color: "#B3261E",
    fontWeight: "700",
    marginLeft: 6,
  },
  loginButton: {
    marginHorizontal: 24,
  },
});
