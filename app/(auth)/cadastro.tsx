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
import { register } from '@/services/auth';

function getRegistrationErrorMessage(error: unknown) {
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
    case 'auth/email-already-in-use':
      return 'Este e-mail já está cadastrado. Faça login ou use outro endereço.';
    case 'auth/weak-password':
      return 'A senha precisa ter pelo menos 6 caracteres.';
    case 'auth/network-request-failed':
    case 'unavailable':
    case 'deadline-exceeded':
      return 'Não foi possível conectar. Verifique sua internet e tente novamente.';
    case 'auth/operation-not-allowed':
      return 'O cadastro por e-mail e senha não está habilitado. Entre em contato com a igreja.';
    case 'permission-denied':
      return 'A conta foi criada, mas o Firestore negou a gravação do perfil. Entre em contato com a igreja antes de tentar novamente.';
    default:
      return 'Não foi possível criar sua conta agora. Tente novamente.';
  }
}

export default function CadastroScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const cadastroEmAndamento = useRef(false);

  async function handleCadastro() {
    if (cadastroEmAndamento.current) return;

    const emailNormalizado = email.trim();

    if (!emailNormalizado) {
      setErro('Informe seu e-mail.');
      return;
    }

    if (!senha) {
      setErro('Informe sua senha.');
      return;
    }

    if (senha.length < 6) {
      setErro('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    if (senha !== confirmarSenha) {
      setErro('As senhas não conferem. Verifique e tente novamente.');
      return;
    }

    cadastroEmAndamento.current = true;
    setLoading(true);
    setErro('');

    try {
      const nomeInicial = emailNormalizado.split('@')[0] || emailNormalizado;
      await register(nomeInicial, emailNormalizado, senha);
      router.replace('/(tabs)');
    } catch (error) {
      setErro(getRegistrationErrorMessage(error));
    } finally {
      cadastroEmAndamento.current = false;
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
            <Text style={styles.subtitle}>Crie sua conta para continuar</Text>
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
              placeholder="Crie uma senha"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="newPassword"
              value={senha}
              onChangeText={(value: string) => {
                setSenha(value);
                setErro('');
              }}
              returnKeyType="next"
              editable={!loading}
              accessibilityLabel="Senha"
            />

            <Text style={styles.label}>Confirmar senha</Text>
            <PasswordInput
              placeholder="Digite a senha novamente"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="newPassword"
              value={confirmarSenha}
              onChangeText={(value: string) => {
                setConfirmarSenha(value);
                setErro('');
              }}
              returnKeyType="done"
              onSubmitEditing={handleCadastro}
              editable={!loading}
              accessibilityLabel="Confirmar senha"
            />

            <FormError message={erro} />

            <AppButton
              title={loading ? 'Criando conta...' : 'Criar minha conta'}
              onPress={handleCadastro}
              disabled={loading}
            />

            <View style={styles.loginPrompt}>
              <Text style={styles.loginText}>Já tem uma conta? </Text>
              <TouchableOpacity
                onPress={() => router.push('/login')}
                disabled={loading}
                accessibilityRole="button"
              >
                <Text style={styles.link}>Entrar</Text>
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
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: Theme.spacing.xl,
  },
  loginText: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.small,
  },
  link: {
    color: Theme.colors.primary,
    fontSize: Theme.typography.small,
    fontWeight: '600',
  },
});
