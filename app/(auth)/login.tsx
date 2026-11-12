import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppInput from '@/components/forms/AppInput';
import FormError from '@/components/forms/FormError';
import PasswordInput from '@/components/forms/PasswordInput';
import AppButton from '@/components/ui/AppButton';
import { Theme } from '@/constants/theme';
import { login } from '@/services/auth';

function getLoginErrorMessage(error: unknown) {
  const code =
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
      ? error.code
      : '';

  switch (code) {
    case 'auth/invalid-email':
      return 'Digite um endereço de e-mail válido.';
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'E-mail ou senha incorretos. Confira os dados e tente novamente.';
    case 'auth/user-disabled':
      return 'Esta conta está desativada. Entre em contato com a igreja.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas de acesso. Aguarde um pouco e tente novamente.';
    case 'auth/network-request-failed':
    case 'unavailable':
    case 'deadline-exceeded':
      return 'Não foi possível conectar. Verifique sua internet e tente novamente.';
    case 'permission-denied':
      return 'Sua conta foi autenticada, mas o Firestore não permitiu criar o perfil. Verifique as regras de acesso e tente novamente.';
    case 'auth/operation-not-allowed':
      return 'O acesso por e-mail e senha não está habilitado. Entre em contato com a igreja.';
    default:
      return 'Não foi possível entrar agora. Tente novamente.';
  }
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const loginEmAndamento = useRef(false);

  async function handleLogin() {
    if (loginEmAndamento.current) return;

    const emailNormalizado = email.trim();

    if (!emailNormalizado) {
      setErro('Informe seu e-mail.');
      return;
    }

    if (!senha) {
      setErro('Informe sua senha.');
      return;
    }

    loginEmAndamento.current = true;
    setLoading(true);
    setErro('');

    try {
      await login(emailNormalizado, senha);
      router.replace('/(tabs)');
    } catch (error) {
      setErro(getLoginErrorMessage(error));
    } finally {
      loginEmAndamento.current = false;
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brand}>
            <View style={styles.logoGlow}>
              <Image
                source={require('../../assets/images/icon.png')}
                style={styles.logo}
                accessibilityLabel="Logo da IP Providência"
              />
            </View>
            <Text style={styles.churchName}>IP Providência</Text>
            <Text style={styles.subtitle}>Entre na sua conta para continuar</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>E-mail</Text>
            <AppInput
              placeholder="seu@email.com"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setErro('');
              }}
              returnKeyType="next"
              editable={!loading}
              accessibilityLabel="E-mail"
            />

            <Text style={styles.label}>Senha</Text>
            <PasswordInput
              placeholder="Digite sua senha"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              value={senha}
              onChangeText={(value: string) => {
                setSenha(value);
                setErro('');
              }}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              editable={!loading}
              accessibilityLabel="Senha"
            />

            <FormError message={erro} />

            <AppButton
              title={loading ? 'Entrando...' : 'Entrar'}
              onPress={handleLogin}
              disabled={loading}
            />

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => router.push('/recuperar')}
              disabled={loading}
              accessibilityRole="button"
            >
              <Text style={styles.link}>Esqueci minha senha</Text>
            </TouchableOpacity>

            <View style={styles.signupPrompt}>
              <Text style={styles.signupText}>Ainda não tem uma conta? </Text>
              <TouchableOpacity
                onPress={() => router.push('/cadastro')}
                disabled={loading}
                accessibilityRole="button"
              >
                <Text style={styles.link}>Criar conta</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.xl,
  },
  brand: {
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
  },
  logoGlow: {
    padding: 12,
    marginBottom: Theme.spacing.md,
    borderRadius: 28,
    backgroundColor: Theme.colors.primary,
    opacity: 0.08,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 18,
  },
  churchName: {
    color: Theme.colors.primary,
    fontSize: Theme.typography.title,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: Theme.spacing.sm,
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.body,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  label: {
    marginBottom: Theme.spacing.xs,
    color: Theme.colors.text,
    fontSize: Theme.typography.small,
    fontWeight: '600',
  },
  linkButton: {
    alignSelf: 'flex-end',
    marginTop: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
  },
  link: {
    color: Theme.colors.primary,
    fontSize: Theme.typography.small,
    fontWeight: '600',
  },
  signupPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: Theme.spacing.xl,
  },
  signupText: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.small,
  },
});
