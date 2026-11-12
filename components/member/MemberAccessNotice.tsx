import { router } from "expo-router";
import { View } from "react-native";

import AppButton from "../ui/AppButton";
import AppHeader from "../ui/AppHeader";
import EmptyState from "../ui/EmptyState";
import Screen from "../ui/Screen";

export default function MemberAccessNotice({
  title,
  authenticated,
  profileError,
}: {
  title: string;
  authenticated: boolean;
  profileError?: boolean;
}) {
  const noticeTitle = profileError
    ? "Perfil indisponível"
    : authenticated
      ? "Conteúdo para membros"
      : "Entre para continuar";
  const description = profileError
    ? "Não foi possível verificar seu perfil. Tente novamente mais tarde."
    : authenticated
      ? "Este conteúdo fica disponível para membros ativos. Para mais informações, fale com a secretaria da igreja."
      : "Entre na sua conta para consultar esta área.";

  return (
    <Screen>
      <AppHeader title={title} />
      <EmptyState
        icon={profileError ? "alert-circle-outline" : "lock-closed-outline"}
        title={noticeTitle}
        description={description}
      />
      {!authenticated && !profileError ? (
        <View style={{ marginHorizontal: 24 }}>
          <AppButton
            title="Ir para entrar"
            onPress={() => router.replace("/login")}
          />
        </View>
      ) : null}
    </Screen>
  );
}
