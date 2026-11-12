import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

import type { AppUser } from "../types/user";
import { auth } from "../services/firebase";
import { getUser } from "../services/userService";

export function useCurrentUserProfile() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!active) return;

      setLoading(true);
      setError(null);

      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const profile = await getUser(firebaseUser.uid);
        if (active) setUser(profile);
      } catch (profileError) {
        console.error("Falha ao carregar o perfil do usuário:", profileError);
        if (active) {
          setUser(null);
          setError(profileError);
        }
      } finally {
        if (active) setLoading(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [refreshVersion]);

  const reload = useCallback(() => {
    setRefreshVersion((version) => version + 1);
  }, []);

  return { user, loading, error, reload };
}
