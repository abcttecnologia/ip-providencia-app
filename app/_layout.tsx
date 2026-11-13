import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import { router, Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Theme } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { auth } from '@/services/firebase';
import { registrarNotificacoes } from '@/services/notificacoes';
import { aceitarConsentimentoLgpd } from '@/services/userService';
import { useCurrentUserProfile } from '@/hooks/useCurrentUserProfile';
import {
  deleteCurrentAuthAccount,
  hasPendingAccountDeletion,
  reauthenticateAndDeleteCurrentAuthAccount,
} from '@/services/accountDeletion';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const { user, loading, error, reload } = useCurrentUserProfile();
  const [acceptingConsent, setAcceptingConsent] = useState(false);
  const [consentErrorState, setConsentErrorState] = useState({
    uid: null as string | null,
    message: '',
  });
  const [acceptedPolicyUid, setAcceptedPolicyUid] = useState<string | null>(null);
  const [pendingDeletionCheck, setPendingDeletionCheck] = useState<{
    checkedUid: string | null;
    pending: boolean;
    error: boolean;
  }>({ checkedUid: null, pending: false, error: false });
  const acceptedPolicy =
    Boolean(user?.uid) && acceptedPolicyUid === user?.uid;
  const consentError =
    consentErrorState.uid === (user?.uid ?? null)
      ? consentErrorState.message
      : '';
  const policyIsOpen = pathname === '/politica';
  const currentUid = auth.currentUser?.uid ?? null;

  useEffect(() => {
    if (!currentUid) return;
    let active = true;
    void hasPendingAccountDeletion(currentUid)
      .then((pending) => {
        if (active) {
          setPendingDeletionCheck({
            checkedUid: currentUid,
            pending,
            error: false,
          });
        }
      })
      .catch((storageError: unknown) => {
        console.error('Não foi possível verificar uma exclusão pendente:', storageError);
        if (active) {
          setPendingDeletionCheck({
            checkedUid: currentUid,
            pending: false,
            error: true,
          });
        }
      });
    return () => {
      active = false;
    };
  }, [currentUid]);

  useEffect(() => {
    if (user?.consentimentoLgpd?.versao !== '1.0') return;

    const appStateSubscription = AppState.addEventListener(
      'change',
      (state) => {
        if (state === 'active' && auth.currentUser?.uid === user.uid) {
          void registrarNotificacoes();
        }
      },
    );
    void registrarNotificacoes();

    return () => {
      appStateSubscription.remove();
    };
  }, [user?.consentimentoLgpd?.versao, user?.uid]);

  async function acceptPrivacyPolicy() {
    if (!acceptedPolicy) {
      setConsentErrorState({
        uid: user?.uid ?? null,
        message: 'Leia e aceite a Política de Privacidade para continuar.',
      });
      return;
    }

    setAcceptingConsent(true);
    setConsentErrorState({ uid: user?.uid ?? null, message: '' });
    try {
      await aceitarConsentimentoLgpd();
      reload();
    } catch (acceptError) {
      console.error('Falha ao registrar consentimento LGPD:', acceptError);
      setConsentErrorState({
        uid: user?.uid ?? null,
        message:
          'Não foi possível registrar seu aceite. Verifique a conexão e tente novamente.',
      });
    } finally {
      setAcceptingConsent(false);
    }
  }

  const authenticated = Boolean(auth.currentUser);
  const needsConsent =
    authenticated && user?.consentimentoLgpd?.versao !== '1.0';
  const isPendingDeletion =
    Boolean(currentUid) &&
    pendingDeletionCheck.checkedUid === currentUid &&
    pendingDeletionCheck.pending &&
    !user;
  const checkingDeletionStatus =
    Boolean(currentUid && !user) &&
    pendingDeletionCheck.checkedUid !== currentUid;
  const deletionCheckFailed =
    Boolean(currentUid) &&
    pendingDeletionCheck.checkedUid === currentUid &&
    pendingDeletionCheck.error &&
    !user;

  return (
    <SafeAreaProvider>
      <ThemeProvider
        value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
      >
        {loading && authenticated ? (
          <View style={styles.centered}>
            <ActivityIndicator color={Theme.colors.primary} />
            <Text style={styles.message}>Verificando sua conta...</Text>
          </View>
        ) : checkingDeletionStatus ? (
          <View style={styles.centered}>
            <ActivityIndicator color={Theme.colors.primary} />
            <Text style={styles.message}>Verificando solicitações da conta...</Text>
          </View>
        ) : error && authenticated ? (
          <View style={styles.centered}>
            <Text style={styles.title}>Não foi possível verificar seu perfil</Text>
            <Text style={styles.message}>
              Verifique sua conexão e tente novamente.
            </Text>
            <Pressable onPress={reload} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : isPendingDeletion ? (
          <PendingAccountDeletionScreen />
        ) : deletionCheckFailed ? (
          <View style={styles.centered}>
            <Text style={styles.title}>Não foi possível verificar a exclusão pendente</Text>
            <Text style={styles.message}>
              Feche e reabra o aplicativo. Se o problema continuar, entre em contato com a igreja.
            </Text>
          </View>
        ) : needsConsent && !policyIsOpen ? (
          <View style={styles.centered}>
            <Text style={styles.title}>Política de Privacidade</Text>
            <Text style={styles.message}>
              Para continuar usando o aplicativo, leia e aceite a Política de
              Privacidade.
            </Text>
            <Pressable
              accessibilityRole="link"
              onPress={() => router.push('/politica')}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Ler política</Text>
            </Pressable>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: acceptedPolicy }}
              onPress={() => {
                setAcceptedPolicyUid(acceptedPolicy ? null : user?.uid ?? null);
                setConsentErrorState({ uid: user?.uid ?? null, message: '' });
              }}
              style={styles.checkboxRow}
            >
              <View
                style={[
                  styles.checkbox,
                  acceptedPolicy ? styles.checkboxChecked : null,
                ]}
              >
                {acceptedPolicy ? (
                  <Text style={styles.checkboxMark}>✓</Text>
                ) : null}
              </View>
              <Text style={styles.message}>
                Li e concordo com a Política de Privacidade.
              </Text>
            </Pressable>
            {consentError ? (
              <Text style={styles.error}>{consentError}</Text>
            ) : null}
            <Pressable
              disabled={acceptingConsent}
              onPress={acceptPrivacyPolicy}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>
                {acceptingConsent ? 'Registrando aceite...' : 'Aceitar e continuar'}
              </Text>
            </Pressable>
          </View>
        ) : (
          <Stack>

          <Stack.Screen
            name="(auth)"
            options={{ headerShown: false }}
          />


          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="dizimos"
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="agenda"
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="boletim"
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="pedidosOracao"
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="anotacoes"
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="pequenosGrupos"
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="ebd"
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="ministerios"
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="familia"
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="plano-biblico"
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="configuracoes"
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="player"
            options={{ headerShown: false }}
          />
          </Stack>
        )}

        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function PendingAccountDeletionScreen() {
  const [password, setPassword] = useState('');
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  async function continueDeletion() {
    if (deleting) return;
    setDeleting(true);
    setError('');
    try {
      await deleteCurrentAuthAccount();
      router.replace('/welcome');
    } catch (deleteError) {
      const code =
        typeof deleteError === 'object' &&
        deleteError !== null &&
        'code' in deleteError &&
        typeof deleteError.code === 'string'
          ? deleteError.code
          : '';
      if (code === 'auth/requires-recent-login') {
        setPasswordRequired(true);
      } else {
        console.error('Não foi possível concluir a exclusão pendente:', deleteError);
        setError('Não foi possível excluir o acesso. Verifique a conexão e tente novamente.');
      }
    } finally {
      setDeleting(false);
    }
  }

  async function confirmPassword() {
    if (!password || deleting) return;
    setDeleting(true);
    setError('');
    try {
      await reauthenticateAndDeleteCurrentAuthAccount(password);
      router.replace('/welcome');
    } catch (reauthError) {
      console.error('Não foi possível reautenticar para excluir a conta:', reauthError);
      const code =
        typeof reauthError === 'object' &&
        reauthError !== null &&
        'code' in reauthError &&
        typeof reauthError.code === 'string'
          ? reauthError.code
          : '';
      setError(
        code === 'auth/wrong-password' || code === 'auth/invalid-credential'
          ? 'A senha está incorreta. Tente novamente.'
          : 'Não foi possível confirmar a senha ou excluir a conta.',
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <View style={styles.centered}>
      <Text style={styles.title}>Concluir exclusão da conta</Text>
      <Text style={styles.message}>
        Seus dados já foram removidos e a solicitação foi registrada. Conclua a exclusão do acesso.
      </Text>
      {passwordRequired ? (
        <>
          <TextInput
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setError('');
            }}
            placeholder="Senha da conta"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!deleting}
            style={{
              width: '100%',
              minHeight: 48,
              marginTop: 10,
              paddingHorizontal: 12,
              borderWidth: 1,
              borderColor: '#D5DED6',
              borderRadius: 10,
              backgroundColor: '#FFFFFF',
            }}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable
            disabled={deleting || !password}
            onPress={() => void confirmPassword()}
            style={[styles.primaryButton, { opacity: deleting || !password ? 0.6 : 1 }]}
          >
            <Text style={styles.primaryButtonText}>
              {deleting ? 'Excluindo...' : 'Confirmar exclusão'}
            </Text>
          </Pressable>
        </>
      ) : (
        <>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable
            disabled={deleting}
            onPress={() => void continueDeletion()}
            style={[styles.primaryButton, { opacity: deleting ? 0.6 : 1 }]}
          >
            <Text style={styles.primaryButtonText}>
              {deleting ? 'Excluindo...' : 'Continuar exclusão'}
            </Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = {
  centered: {
    flex: 1,
    justifyContent: 'center' as const,
    padding: 24,
    backgroundColor: Theme.colors.background,
  },
  title: {
    marginBottom: 12,
    color: Theme.colors.primary,
    fontSize: 20,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
  },
  message: {
    marginBottom: 16,
    color: Theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center' as const,
  },
  primaryButton: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: 48,
    marginTop: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: Theme.colors.primary,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  secondaryButton: {
    alignItems: 'center' as const,
    padding: 12,
  },
  secondaryButtonText: {
    color: Theme.colors.primary,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  checkboxRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginTop: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 10,
    borderWidth: 1,
    borderColor: Theme.colors.textSecondary,
    borderRadius: 4,
  },
  checkboxChecked: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primary,
  },
  checkboxMark: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700' as const,
  },
  error: {
    marginTop: 12,
    color: '#B3261E',
    fontSize: 12,
    textAlign: 'center' as const,
  },
};
