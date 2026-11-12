import { Redirect, Stack } from "expo-router";

import Screen from "../../components/ui/Screen";
import ScreenLoader from "../../components/ui/ScreenLoader";
import { useCurrentUserProfile } from "../../hooks/useCurrentUserProfile";

export default function AdminLayout() {
  const { user, loading } = useCurrentUserProfile();

  if (loading) {
    return (
      <Screen>
        <ScreenLoader message="Verificando permissões..." />
      </Screen>
    );
  }

  if (user?.ativo !== true || user.perfil !== "ADMINISTRADOR") {
    return <Redirect href="/(tabs)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
