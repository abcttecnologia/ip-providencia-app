import { useCurrentUserProfile } from "./useCurrentUserProfile";

export function useMemberAccess() {
  const profile = useCurrentUserProfile();
  const canAccessMemberFeatures = Boolean(
    profile.user?.ativo &&
      (profile.user.perfil === "MEMBRO" ||
        profile.user.perfil === "ADMINISTRADOR"),
  );

  return { ...profile, canAccessMemberFeatures };
}
