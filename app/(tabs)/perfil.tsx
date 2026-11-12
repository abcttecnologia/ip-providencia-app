import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import AppInput from "../../components/forms/AppInput";
import AppButton from "../../components/ui/AppButton";
import AppCard from "../../components/ui/AppCard";
import AppHeader from "../../components/ui/AppHeader";
import EmptyState from "../../components/ui/EmptyState";
import RefreshableScroll from "../../components/ui/RefreshableScroll";
import Screen from "../../components/ui/Screen";
import ScreenLoader from "../../components/ui/ScreenLoader";
import { useCurrentUserProfile } from "../../hooks/useCurrentUserProfile";
import type { AccessOption } from "../../services/userService";
import {
  getUserAccessOptions,
  listUsersForAdmin,
  updateOwnProfile,
  updateUserAccess,
} from "../../services/userService";
import type { AppUser, UserPersonalUpdate } from "../../types/user";

interface SelectionOption {
  value: string;
  label: string;
}

interface SelectionModalProps {
  visible: boolean;
  title: string;
  options: SelectionOption[];
  selected: string[];
  multiple?: boolean;
  onClose: () => void;
  onSelect: (values: string[]) => void;
}

function SelectionModal({
  visible,
  title,
  options,
  selected,
  multiple = false,
  onClose,
  onSelect,
}: SelectionModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          <ScrollView style={styles.optionList}>
            {options.length === 0 ? (
              <Text style={styles.mutedText}>Nenhuma opção cadastrada.</Text>
            ) : (
              options.map((option) => {
                const isSelected = selected.includes(option.value);
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      if (multiple) {
                        onSelect(
                          isSelected
                            ? selected.filter((value) => value !== option.value)
                            : [...selected, option.value],
                        );
                      } else {
                        onSelect([option.value]);
                        onClose();
                      }
                    }}
                    style={styles.optionRow}
                  >
                    <Text style={styles.optionLabel}>{option.label}</Text>
                    <Ionicons
                      name={
                        isSelected
                          ? "checkmark-circle"
                          : multiple
                            ? "ellipse-outline"
                            : "chevron-forward"
                      }
                      size={22}
                      color="#1E5631"
                    />
                  </Pressable>
                );
              })
            )}
          </ScrollView>
          <View style={styles.modalActions}>
            <Pressable
              onPress={() => {
                onSelect([]);
                onClose();
              }}
              style={styles.modalAction}
            >
              <Text style={styles.linkText}>Limpar vínculo</Text>
            </Pressable>
            {multiple ? (
              <Pressable onPress={onClose} style={styles.modalAction}>
                <Text style={styles.linkText}>Concluir</Text>
              </Pressable>
            ) : (
              <Pressable onPress={onClose} style={styles.modalAction}>
                <Text style={styles.linkText}>Cancelar</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function getOptionLabel(options: AccessOption[], id: string) {
  return options.find((option) => option.id === id)?.nome ?? id;
}

function PersonalProfileForm({
  user,
  onSaved,
}: {
  user: AppUser;
  onSaved: () => void;
}) {
  const [nome, setNome] = useState(user.nome ?? "");
  const [telefone, setTelefone] = useState(user.telefone ?? "");
  const [endereco, setEndereco] = useState(user.endereco ?? "");
  const [dataNascimento, setDataNascimento] = useState(
    user.dataNascimento ?? "",
  );
  const [estadoCivil, setEstadoCivil] = useState(user.estadoCivil ?? "");
  const [fotoUrl, setFotoUrl] = useState(user.fotoUrl ?? "");
  const [saving, setSaving] = useState(false);

  async function saveProfile() {
    if (saving) return;
    if (!nome.trim()) {
      Alert.alert("Confira seus dados", "Informe seu nome.");
      return;
    }

    const changes: UserPersonalUpdate = {
      nome: nome.trim(),
      telefone: telefone.trim(),
      endereco: endereco.trim(),
      dataNascimento: dataNascimento.trim(),
      estadoCivil: estadoCivil.trim(),
      fotoUrl: fotoUrl.trim(),
    };

    setSaving(true);
    try {
      await updateOwnProfile(user.uid, changes);
      onSaved();
      Alert.alert("Perfil atualizado", "Seus dados pessoais foram salvos.");
    } catch (saveError) {
      console.error("Falha ao salvar o perfil:", saveError);
      Alert.alert(
        "Não foi possível salvar",
        "Verifique sua conexão e tente novamente.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Text style={styles.sectionTitle}>Dados pessoais</Text>
      <Text style={styles.label}>Nome</Text>
      <AppInput value={nome} onChangeText={setNome} editable={!saving} />
      <Text style={styles.label}>E-mail</Text>
      <AppInput value={user.email} editable={false} />
      <Text style={styles.label}>Telefone</Text>
      <AppInput
        value={telefone}
        onChangeText={setTelefone}
        keyboardType="phone-pad"
        editable={!saving}
      />
      <Text style={styles.label}>Endereço</Text>
      <AppInput value={endereco} onChangeText={setEndereco} editable={!saving} />
      <Text style={styles.label}>Data de nascimento</Text>
      <AppInput
        value={dataNascimento}
        onChangeText={setDataNascimento}
        placeholder="DD/MM/AAAA"
        editable={!saving}
      />
      <Text style={styles.label}>Estado civil</Text>
      <AppInput
        value={estadoCivil}
        onChangeText={setEstadoCivil}
        editable={!saving}
      />
      <Text style={styles.label}>Foto (URL)</Text>
      <AppInput
        value={fotoUrl}
        onChangeText={setFotoUrl}
        autoCapitalize="none"
        keyboardType="url"
        editable={!saving}
      />
      <AppButton
        title={saving ? "Salvando..." : "Salvar meus dados"}
        onPress={saveProfile}
        disabled={saving}
      />
    </>
  );
}

export default function PerfilScreen() {
  const { user, loading, error: profileError, reload } = useCurrentUserProfile();
  const [adminLoading, setAdminLoading] = useState(true);
  const [adminError, setAdminError] = useState("");
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminUsers, setAdminUsers] = useState<AppUser[]>([]);
  const [accessOptions, setAccessOptions] = useState<{
    ministerios: AccessOption[];
    pequenosGrupos: AccessOption[];
    salasEbd: AccessOption[];
    familias: AccessOption[];
  }>({
    ministerios: [],
    pequenosGrupos: [],
    salasEbd: [],
    familias: [],
  });
  const [selectedAdminUserId, setSelectedAdminUserId] = useState("");
  const [selectedMinisterios, setSelectedMinisterios] = useState<string[]>([]);
  const [selectedPequenoGrupo, setSelectedPequenoGrupo] = useState<string[]>([]);
  const [selectedSalaEbd, setSelectedSalaEbd] = useState<string[]>([]);
  const [selectedFamilia, setSelectedFamilia] = useState<string[]>([]);
  const [selector, setSelector] = useState<
    "user" | "ministerios" | "pg" | "ebd" | "familia" | null
  >(null);

  const selectedAdminUser = useMemo(
    () => adminUsers.find((candidate) => candidate.uid === selectedAdminUserId) ?? null,
    [adminUsers, selectedAdminUserId],
  );

  useEffect(() => {
    if (user?.perfil !== "ADMINISTRADOR" || !user.ativo) return;

    let active = true;

    Promise.all([listUsersForAdmin(), getUserAccessOptions()])
      .then(([users, options]) => {
        if (!active) return;
        setAdminUsers(users);
        setAccessOptions(options);
      })
      .catch((loadError) => {
        console.error("Falha ao carregar dados administrativos:", loadError);
        if (active) {
          setAdminError(
            "Não foi possível carregar os usuários e vínculos. Verifique sua conexão e suas permissões.",
          );
        }
      })
      .finally(() => {
        if (active) setAdminLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user?.uid, user?.perfil, user?.ativo]);

  function selectAdminUser(uid: string) {
    const selected = adminUsers.find((candidate) => candidate.uid === uid);
    setSelectedAdminUserId(uid);
    setSelectedMinisterios(selected?.ministerios ?? []);
    setSelectedPequenoGrupo(
      selected?.pequenoGrupoId ? [selected.pequenoGrupoId] : [],
    );
    setSelectedSalaEbd(selected?.salaEbdId ? [selected.salaEbdId] : []);
    setSelectedFamilia(selected?.familiaId ? [selected.familiaId] : []);
    setSelector(null);
  }

  async function promoteSelectedUser() {
    if (!selectedAdminUser || adminSaving) return;
    if (selectedAdminUser.perfil !== "VISITANTE") return;

    setAdminSaving(true);
    try {
      await updateUserAccess(selectedAdminUser.uid, {
        perfil: "MEMBRO",
        membroDesde: new Date(),
      });
      await refreshAdminUsers(selectedAdminUser.uid);
      Alert.alert("Usuário promovido", "O perfil agora é MEMBRO.");
    } catch (saveError) {
      console.error("Falha ao promover usuário:", saveError);
      Alert.alert(
        "Não foi possível promover",
        "Verifique as regras e tente novamente.",
      );
    } finally {
      setAdminSaving(false);
    }
  }

  async function saveUserAccess() {
    if (!selectedAdminUser || adminSaving) return;

    setAdminSaving(true);
    try {
      await updateUserAccess(selectedAdminUser.uid, {
        ministerios: selectedMinisterios,
        pequenoGrupoId: selectedPequenoGrupo[0] ?? null,
        salaEbdId: selectedSalaEbd[0] ?? null,
        familiaId: selectedFamilia[0] ?? null,
      });
      await refreshAdminUsers(selectedAdminUser.uid);
      Alert.alert("Vínculos atualizados", "Os vínculos foram salvos.");
    } catch (saveError) {
      console.error("Falha ao salvar vínculos do usuário:", saveError);
      Alert.alert(
        "Não foi possível salvar",
        "Verifique as regras e tente novamente.",
      );
    } finally {
      setAdminSaving(false);
    }
  }

  async function refreshAdminUsers(selectedUid: string) {
    const users = await listUsersForAdmin();
    setAdminUsers(users);
    setSelectedAdminUserId(selectedUid);
  }

  if (loading) {
    return (
      <Screen>
        <ScreenLoader message="Carregando perfil..." />
      </Screen>
    );
  }

  if (!user) {
    return (
      <Screen>
        <AppHeader title="Meu Perfil" showBack={false} />
        <EmptyState
          icon="person-outline"
          title={profileError ? "Perfil indisponível" : "Entre na sua conta"}
          description={
            profileError
              ? "Não foi possível carregar seus dados. Tente novamente mais tarde."
              : "Entre para consultar e editar seu perfil."
          }
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

  const userOptions: SelectionOption[] = adminUsers.map((candidate) => ({
    value: candidate.uid,
    label: `${candidate.nome} · ${candidate.email}`,
  }));
  const ministryOptions = accessOptions.ministerios.map((option) => ({
    value: option.id,
    label: option.nome,
  }));
  const groupOptions = accessOptions.pequenosGrupos.map((option) => ({
    value: option.id,
    label: option.nome,
  }));
  const ebdOptions = accessOptions.salasEbd.map((option) => ({
    value: option.id,
    label: option.nome,
  }));
  const familyOptions = accessOptions.familias.map((option) => ({
    value: option.id,
    label: option.nome,
  }));

  return (
    <>
      <Screen>
        <AppHeader title="Meu Perfil" showBack={false} />
        <RefreshableScroll
          contentContainerStyle={styles.content}
          refreshing={false}
          onRefresh={() => reload()}
        >
          <AppCard>
            <PersonalProfileForm user={user} onSaved={reload} />
          </AppCard>

          <AppCard>
            <Text style={styles.sectionTitle}>Acesso</Text>
            <Text style={styles.bodyText}>Perfil: {user.perfil}</Text>
            <Text style={styles.bodyText}>
              Situação: {user.ativo ? "Ativo" : "Inativo"}
            </Text>
          </AppCard>

          {user.perfil === "ADMINISTRADOR" && user.ativo ? (
            <AppCard>
              <Text style={styles.sectionTitle}>Gerenciar pessoas</Text>
              {adminLoading ? (
                <ScreenLoader message="Carregando pessoas..." />
              ) : adminError ? (
                <Text style={styles.errorText}>{adminError}</Text>
              ) : (
                <>
                  <Text style={styles.label}>Pessoa</Text>
                  <Pressable
                    onPress={() => setSelector("user")}
                    style={styles.selector}
                  >
                    <Text style={styles.selectorText}>
                      {selectedAdminUser
                        ? `${selectedAdminUser.nome} · ${selectedAdminUser.email}`
                        : "Selecione uma pessoa"}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#023411" />
                  </Pressable>

                  {selectedAdminUser ? (
                    <>
                      <Text style={styles.bodyText}>
                        Perfil atual: {selectedAdminUser.perfil}
                      </Text>
                      {selectedAdminUser.perfil === "VISITANTE" ? (
                        <View style={styles.actionSpacing}>
                          <AppButton
                            title={adminSaving ? "Promovendo..." : "Promover para MEMBRO"}
                            onPress={promoteSelectedUser}
                            disabled={adminSaving}
                          />
                        </View>
                      ) : null}

                      <Text style={[styles.label, styles.accessLabel]}>
                        Ministérios
                      </Text>
                      <Pressable
                        onPress={() => setSelector("ministerios")}
                        style={styles.selector}
                      >
                        <Text style={styles.selectorText}>
                          {selectedMinisterios.length
                            ? selectedMinisterios
                                .map((id) =>
                                  getOptionLabel(accessOptions.ministerios, id),
                                )
                                .join(", ")
                            : "Nenhum ministério"}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#023411" />
                      </Pressable>

                      <Text style={[styles.label, styles.accessLabel]}>
                        Pequeno Grupo
                      </Text>
                      <Pressable
                        onPress={() => setSelector("pg")}
                        style={styles.selector}
                      >
                        <Text style={styles.selectorText}>
                          {selectedPequenoGrupo[0]
                            ? getOptionLabel(
                                accessOptions.pequenosGrupos,
                                selectedPequenoGrupo[0],
                              )
                            : "Sem vínculo"}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#023411" />
                      </Pressable>

                      <Text style={[styles.label, styles.accessLabel]}>
                        Sala da EBD
                      </Text>
                      <Pressable
                        onPress={() => setSelector("ebd")}
                        style={styles.selector}
                      >
                        <Text style={styles.selectorText}>
                          {selectedSalaEbd[0]
                            ? getOptionLabel(accessOptions.salasEbd, selectedSalaEbd[0])
                            : "Sem vínculo"}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#023411" />
                      </Pressable>

                      <Text style={[styles.label, styles.accessLabel]}>
                        Família
                      </Text>
                      <Pressable
                        onPress={() => setSelector("familia")}
                        style={styles.selector}
                      >
                        <Text style={styles.selectorText}>
                          {selectedFamilia[0]
                            ? getOptionLabel(accessOptions.familias, selectedFamilia[0])
                            : "Sem vínculo"}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#023411" />
                      </Pressable>

                      <View style={styles.actionSpacing}>
                        <AppButton
                          title={adminSaving ? "Salvando..." : "Salvar vínculos"}
                          onPress={saveUserAccess}
                          disabled={adminSaving}
                        />
                      </View>
                    </>
                  ) : null}
                </>
              )}
            </AppCard>
          ) : null}
        </RefreshableScroll>

        <SelectionModal
          visible={selector !== null}
          title={
            selector === "user"
              ? "Selecionar pessoa"
              : selector === "ministerios"
                ? "Selecionar ministérios"
                : selector === "pg"
                  ? "Selecionar Pequeno Grupo"
                  : selector === "ebd"
                    ? "Selecionar sala da EBD"
                    : "Selecionar família"
          }
          options={
            selector === "user"
              ? userOptions
              : selector === "ministerios"
                ? ministryOptions
                : selector === "pg"
                  ? groupOptions
                  : selector === "ebd"
                    ? ebdOptions
                    : familyOptions
          }
          selected={
            selector === "user"
              ? selectedAdminUserId
                ? [selectedAdminUserId]
                : []
              : selector === "ministerios"
                ? selectedMinisterios
                : selector === "pg"
                  ? selectedPequenoGrupo
                  : selector === "ebd"
                    ? selectedSalaEbd
                    : selectedFamilia
          }
          multiple={selector === "ministerios"}
          onClose={() => setSelector(null)}
          onSelect={(values) => {
            if (selector === "user") selectAdminUser(values[0] ?? "");
            if (selector === "ministerios") setSelectedMinisterios(values);
            if (selector === "pg") setSelectedPequenoGrupo(values);
            if (selector === "ebd") setSelectedSalaEbd(values);
            if (selector === "familia") setSelectedFamilia(values);
          }}
        />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    color: "#023411",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 16,
  },
  label: {
    color: "#546B5F",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 5,
  },
  bodyText: {
    color: "#546B5F",
    fontSize: 14,
    marginBottom: 8,
  },
  errorText: {
    color: "#B3261E",
    fontSize: 14,
    lineHeight: 21,
  },
  selector: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 16,
    paddingHorizontal: 14,
    marginBottom: 14,
    backgroundColor: "#FFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectorText: {
    color: "#333",
    flex: 1,
    marginRight: 10,
  },
  accessLabel: {
    marginTop: 6,
  },
  actionSpacing: {
    marginTop: 8,
    marginBottom: 8,
  },
  loginButton: {
    marginHorizontal: 24,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  modalContent: {
    maxHeight: "80%",
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
  },
  modalTitle: {
    color: "#023411",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  optionList: {
    maxHeight: 420,
  },
  optionRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#DDD",
  },
  optionLabel: {
    color: "#333",
    flex: 1,
    marginRight: 12,
  },
  mutedText: {
    color: "#666",
    paddingVertical: 18,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },
  modalAction: {
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  linkText: {
    color: "#1E5631",
    fontWeight: "700",
  },
});
