import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import AppInput from "../../components/forms/AppInput";
import FormError from "../../components/forms/FormError";
import AppButton from "../../components/ui/AppButton";
import AppCard from "../../components/ui/AppCard";
import AppHeader from "../../components/ui/AppHeader";
import RefreshableScroll from "../../components/ui/RefreshableScroll";
import Screen from "../../components/ui/Screen";
import ScreenLoader from "../../components/ui/ScreenLoader";
import {
  createAviso,
  deleteAviso,
  getAvisos,
  updateAviso,
  type Aviso,
  type AvisoInput,
} from "../../services/avisos";
import {
  createEvento,
  deleteEvento,
  getEventos,
  updateEvento,
  type EventoInput,
} from "../../services/eventos";
import type { Evento, Publico } from "../../types/firestore";

type ContentKind = "aviso" | "evento";

const AUDIENCES: { value: Publico; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "membros", label: "Membros" },
  { value: "ministerio", label: "Ministério" },
  { value: "pg", label: "PG" },
];

const AVISO_CATEGORIES = [
  { value: "geral", label: "Geral" },
  { value: "ministerio", label: "Ministério" },
  { value: "comunhao", label: "Comunhão" },
] as const;

function isTargetedAudience(publico: Publico) {
  return publico === "ministerio" || publico === "pg";
}

export default function AdminContentScreen() {
  const [kind, setKind] = useState<ContentKind>("aviso");
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState("");
  const [categoriaAviso, setCategoriaAviso] =
    useState<(typeof AVISO_CATEGORIES)[number]["value"]>("geral");
  const [categoriaEvento, setCategoriaEvento] = useState("");
  const [publico, setPublico] = useState<Publico>("todos");
  const [alvoId, setAlvoId] = useState("");
  const [importante, setImportante] = useState(false);
  const [ativo, setAtivo] = useState(true);
  const [subtitulo, setSubtitulo] = useState("");
  const [imagem, setImagem] = useState("");
  const [tipoEvento, setTipoEvento] = useState("");
  const [ordem, setOrdem] = useState("0");

  function loadContent() {
    Promise.all([getAvisos(), getEventos()])
      .then(([noticeResult, eventResult]) => {
        setAvisos(noticeResult.data);
        setEventos(eventResult);
        setError("");
      })
      .catch((loadError) => {
        console.error("Falha ao carregar conteúdo administrativo:", loadError);
        setError("Não foi possível carregar o conteúdo. Tente novamente.");
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }

  useEffect(() => {
    loadContent();
  }, []);

  function resetForm() {
    setEditingId(null);
    setTitulo("");
    setDescricao("");
    setData("");
    setCategoriaAviso("geral");
    setCategoriaEvento("");
    setPublico("todos");
    setAlvoId("");
    setImportante(false);
    setAtivo(true);
    setSubtitulo("");
    setImagem("");
    setTipoEvento("");
    setOrdem("0");
    setError("");
  }

  function selectKind(nextKind: ContentKind) {
    setKind(nextKind);
    resetForm();
    setError("");
  }

  function editNotice(notice: Aviso) {
    setEditingId(notice.id);
    setTitulo(notice.titulo ?? "");
    setDescricao(notice.descricao ?? "");
    setData(notice.data ?? "");
    setCategoriaAviso(notice.categoria ?? "geral");
    setPublico(notice.publico ?? "todos");
    setAlvoId(notice.alvoId ?? "");
    setImportante(notice.importante ?? false);
    setError("");
  }

  function editEvent(event: Evento) {
    setEditingId(event.id);
    setTitulo(event.titulo ?? "");
    setDescricao(event.descricao ?? "");
    setData(event.data ?? "");
    setCategoriaEvento(event.categoria ?? "");
    setPublico(event.publico ?? "todos");
    setAlvoId(event.alvoId ?? "");
    setAtivo(event.ativo);
    setSubtitulo(event.subtitulo ?? "");
    setImagem(event.imagem ?? "");
    setTipoEvento(event.tipo ?? "");
    setOrdem(String(event.ordem ?? 0));
    setError("");
  }

  async function saveContent() {
    if (saving) return;
    if (!titulo.trim()) {
      setError("Informe o título.");
      return;
    }
    if (isTargetedAudience(publico) && !alvoId.trim()) {
      setError("Informe o ID do ministério ou do Pequeno Grupo.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      if (kind === "aviso") {
        const notice: AvisoInput = {
          titulo: titulo.trim(),
          descricao: descricao.trim(),
          data: data.trim(),
          importante,
          publico,
          categoria: categoriaAviso,
          alvoId: isTargetedAudience(publico) ? alvoId.trim() : null,
        };
        if (editingId) await updateAviso(editingId, notice);
        else await createAviso(notice);
      } else {
        const event: EventoInput = {
          titulo: titulo.trim(),
          descricao: descricao.trim(),
          data: data.trim(),
          categoria: categoriaEvento.trim(),
          publico,
          alvoId: isTargetedAudience(publico) ? alvoId.trim() : null,
          ativo,
          subtitulo: subtitulo.trim(),
          imagem: imagem.trim(),
          tipo: tipoEvento.trim(),
          ordem: Number.parseInt(ordem, 10) || 0,
        };
        if (editingId) await updateEvento(editingId, event);
        else await createEvento(event);
      }

      resetForm();
      loadContent();
    } catch (saveError) {
      console.error("Falha ao salvar conteúdo:", saveError);
      setError(
        "Não foi possível salvar. Verifique a conexão e se sua conta tem permissão de administrador.",
      );
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(id: string, label: string) {
    Alert.alert(
      `Excluir ${kind === "aviso" ? "aviso" : "evento"}?`,
      `“${label}” será removido permanentemente.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => void removeContent(id),
        },
      ],
    );
  }

  async function removeContent(id: string) {
    try {
      if (kind === "aviso") await deleteAviso(id);
      else await deleteEvento(id);
      if (editingId === id) resetForm();
      loadContent();
    } catch (deleteError) {
      console.error("Falha ao excluir conteúdo:", deleteError);
      Alert.alert(
        "Não foi possível excluir",
        "Verifique sua conexão e suas permissões.",
      );
    }
  }

  if (loading) {
    return (
      <Screen>
        <AppHeader title="Gerenciar conteúdo" />
        <ScreenLoader message="Carregando avisos e eventos..." />
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader title="Gerenciar conteúdo" />
      <RefreshableScroll
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          loadContent();
        }}
        contentContainerStyle={styles.content}
      >
        <View style={styles.kindSelector}>
          <Pressable
            onPress={() => selectKind("aviso")}
            style={[styles.kindButton, kind === "aviso" && styles.kindSelected]}
          >
            <Text
              style={[
                styles.kindText,
                kind === "aviso" && styles.kindTextSelected,
              ]}
            >
              Avisos
            </Text>
          </Pressable>
          <Pressable
            onPress={() => selectKind("evento")}
            style={[
              styles.kindButton,
              kind === "evento" && styles.kindSelected,
            ]}
          >
            <Text
              style={[
                styles.kindText,
                kind === "evento" && styles.kindTextSelected,
              ]}
            >
              Eventos
            </Text>
          </Pressable>
        </View>

        <AppCard>
          <Text style={styles.sectionTitle}>
            {editingId ? "Editar" : "Criar"} {kind === "aviso" ? "aviso" : "evento"}
          </Text>
          <Text style={styles.label}>Título</Text>
          <AppInput value={titulo} onChangeText={setTitulo} editable={!saving} />
          {kind === "evento" ? (
            <>
              <Text style={styles.label}>Subtítulo</Text>
              <AppInput
                value={subtitulo}
                onChangeText={setSubtitulo}
                editable={!saving}
              />
              <Text style={styles.label}>Categoria</Text>
              <AppInput
                value={categoriaEvento}
                onChangeText={setCategoriaEvento}
                placeholder="Ex.: culto, campanha"
                editable={!saving}
              />
              <Text style={styles.label}>Tipo</Text>
              <AppInput
                value={tipoEvento}
                onChangeText={setTipoEvento}
                editable={!saving}
              />
              <Text style={styles.label}>Imagem (URL)</Text>
              <AppInput
                value={imagem}
                onChangeText={setImagem}
                autoCapitalize="none"
                keyboardType="url"
                editable={!saving}
              />
              <Text style={styles.label}>Ordem</Text>
              <AppInput
                value={ordem}
                onChangeText={setOrdem}
                keyboardType="number-pad"
                editable={!saving}
              />
              <Pressable
                onPress={() => setAtivo((current) => !current)}
                style={styles.toggle}
              >
                <Ionicons
                  name={ativo ? "checkbox" : "square-outline"}
                  size={22}
                  color="#1E5631"
                />
                <Text style={styles.toggleLabel}>Evento ativo</Text>
              </Pressable>
            </>
          ) : null}
          <Text style={styles.label}>Descrição</Text>
          <AppInput
            value={descricao}
            onChangeText={setDescricao}
            multiline
            textAlignVertical="top"
            style={styles.descriptionInput}
            editable={!saving}
          />
          <Text style={styles.label}>Data exibida</Text>
          <AppInput
            value={data}
            onChangeText={setData}
            placeholder="Ex.: 12/11/2026"
            editable={!saving}
          />

          {kind === "aviso" ? (
            <>
              <Text style={styles.label}>Categoria do aviso</Text>
              <View style={styles.chipRow}>
                {AVISO_CATEGORIES.map((category) => (
                  <Pressable
                    key={category.value}
                    onPress={() => setCategoriaAviso(category.value)}
                    style={[
                      styles.chip,
                      categoriaAviso === category.value && styles.chipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        categoriaAviso === category.value &&
                          styles.chipTextSelected,
                      ]}
                    >
                      {category.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Pressable
                onPress={() => setImportante((current) => !current)}
                style={styles.toggle}
              >
                <Ionicons
                  name={importante ? "checkbox" : "square-outline"}
                  size={22}
                  color="#1E5631"
                />
                <Text style={styles.toggleLabel}>Aviso importante</Text>
              </Pressable>
            </>
          ) : null}

          <Text style={[styles.label, styles.audienceLabel]}>Público</Text>
          <View style={styles.chipRow}>
            {AUDIENCES.map((audience) => (
              <Pressable
                key={audience.value}
                onPress={() => {
                  setPublico(audience.value);
                  if (!isTargetedAudience(audience.value)) setAlvoId("");
                }}
                style={[
                  styles.chip,
                  publico === audience.value && styles.chipSelected,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    publico === audience.value && styles.chipTextSelected,
                  ]}
                >
                  {audience.label}
                </Text>
              </Pressable>
            ))}
          </View>
          {isTargetedAudience(publico) ? (
            <>
              <Text style={styles.label}>ID do alvo</Text>
              <AppInput
                value={alvoId}
                onChangeText={setAlvoId}
                placeholder={
                  publico === "ministerio"
                    ? "ID do ministério"
                    : "ID do Pequeno Grupo"
                }
                autoCapitalize="none"
                editable={!saving}
              />
            </>
          ) : null}

          <FormError message={error} />
          <AppButton
            title={saving ? "Salvando..." : editingId ? "Salvar alterações" : "Publicar"}
            onPress={saveContent}
            disabled={saving}
          />
          {editingId ? (
            <Pressable onPress={resetForm} style={styles.cancelEdit}>
              <Text style={styles.linkText}>Cancelar edição</Text>
            </Pressable>
          ) : null}
        </AppCard>

        <Text style={styles.listTitle}>
          {kind === "aviso" ? "Avisos cadastrados" : "Eventos cadastrados"}
        </Text>
        {error && !editingId ? <FormError message={error} /> : null}
        {(kind === "aviso" ? avisos : eventos).length === 0 ? (
          <Text style={styles.emptyText}>Nenhum item cadastrado.</Text>
        ) : kind === "aviso" ? (
          avisos.map((notice) => (
            <ContentRow
              key={notice.id}
              title={notice.titulo}
              subtitle={`${notice.categoria ?? "geral"} · ${notice.publico ?? "todos"}`}
              onEdit={() => editNotice(notice)}
              onDelete={() => confirmDelete(notice.id, notice.titulo)}
            />
          ))
        ) : (
          eventos.map((event) => (
            <ContentRow
              key={event.id}
              title={event.titulo}
              subtitle={`${event.categoria || event.tipo || "Evento"} · ${event.publico ?? "todos"}`}
              onEdit={() => editEvent(event)}
              onDelete={() => confirmDelete(event.id, event.titulo)}
            />
          ))
        )}
      </RefreshableScroll>
    </Screen>
  );
}

function ContentRow({
  title,
  subtitle,
  onEdit,
  onDelete,
}: {
  title: string;
  subtitle: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <AppCard style={styles.contentRow}>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <Pressable
        onPress={onEdit}
        accessibilityRole="button"
        accessibilityLabel={`Editar ${title}`}
        style={styles.rowIcon}
      >
        <Ionicons name="create-outline" size={22} color="#1E5631" />
      </Pressable>
      <Pressable
        onPress={onDelete}
        accessibilityRole="button"
        accessibilityLabel={`Excluir ${title}`}
        style={styles.rowIcon}
      >
        <Ionicons name="trash-outline" size={22} color="#B3261E" />
      </Pressable>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 18,
    paddingBottom: 48,
  },
  kindSelector: {
    flexDirection: "row",
    padding: 4,
    marginBottom: 16,
    backgroundColor: "#DDE5DC",
    borderRadius: 16,
  },
  kindButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 11,
    borderRadius: 13,
  },
  kindSelected: {
    backgroundColor: "#023411",
  },
  kindText: {
    color: "#546B5F",
    fontWeight: "700",
  },
  kindTextSelected: {
    color: "#FFF",
  },
  sectionTitle: {
    color: "#023411",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    textTransform: "capitalize",
  },
  label: {
    color: "#546B5F",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 5,
  },
  descriptionInput: {
    minHeight: 110,
    paddingTop: 14,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#B9C9BB",
    backgroundColor: "#FFF",
  },
  chipSelected: {
    borderColor: "#023411",
    backgroundColor: "#023411",
  },
  chipText: {
    color: "#546B5F",
    fontSize: 12,
    fontWeight: "600",
  },
  chipTextSelected: {
    color: "#FFF",
  },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  toggleLabel: {
    marginLeft: 8,
    color: "#333",
    fontSize: 14,
  },
  audienceLabel: {
    marginTop: 8,
  },
  cancelEdit: {
    alignItems: "center",
    paddingTop: 14,
  },
  linkText: {
    color: "#1E5631",
    fontWeight: "700",
  },
  listTitle: {
    color: "#023411",
    fontSize: 17,
    fontWeight: "700",
    marginVertical: 12,
  },
  emptyText: {
    color: "#666",
    textAlign: "center",
    paddingVertical: 18,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  rowCopy: {
    flex: 1,
  },
  rowTitle: {
    color: "#023411",
    fontSize: 14,
    fontWeight: "700",
  },
  rowSubtitle: {
    color: "#66736A",
    fontSize: 12,
    marginTop: 4,
  },
  rowIcon: {
    padding: 8,
  },
});
