import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
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
import AppButton from '@/components/ui/AppButton';
import { Theme } from '@/constants/theme';
import { resetPassword } from '@/services/auth';

const SUCCESS_MESSAGE =
  'Se houver uma conta associada a este e-mail, você receberá as instruções para redefinir sua senha.';

function getResetErrorMessage(error: unknown) {
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
    case 'auth/user-not-found':
      return null;
    case 'auth/network-request-failed':
    case 'unavailable':
    case 'deadline-exceeded':
      return 'Não foi possível conectar. Verifique sua internet e tente novamente.';
    default:
      return 'Não foi possível enviar as instruções agora. Tente novamente.';
  }
}

export default function RecuperarScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const requestInProgress = useRef(false);

  async function handleResetPassword() {
    if (requestInProgress.current) return;

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setErro('Informe seu e-mail.');
      setSucesso('');
      return;
    }

    requestInProgress.current = true;
    setLoading(true);
    setErro('');
    setSucesso('');

    try {
      await resetPassword(normalizedEmail);
      setSucesso(SUCCESS_MESSAGE);
    } catch (error) {
      const message = getResetErrorMessage(error);
      if (message) {
        console.error('Falha ao solicitar redefinição de senha:', error);
        setErro(message);
      } else {
        setSucesso(SUCCESS_MESSAGE);
      }
    } finally {
      requestInProgress.current = false;
      setLoading(false);
    }
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.heading}>
            <Text style={styles.title}>Recuperar senha</Text>
            <Text style={styles.description}>
              Informe o e-mail da sua conta. Se ele estiver cadastrado, enviaremos
              as instruções para redefinir sua senha.
            </Text>
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
                setSucesso('');
              }}
              returnKeyType="send"
              onSubmitEditing={handleResetPassword}
              editable={!loading}
              accessibilityLabel="E-mail"
            />

            <FormError message={erro} />
            {sucesso ? <Text style={styles.success}>{sucesso}</Text> : null}

            <AppButton
              title={loading ? 'Enviando...' : 'Enviar instruções'}
              onPress={handleResetPassword}
              disabled={loading}
            />

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => router.replace('/login')}
              disabled={loading}
              accessibilityRole="button"
            >
              <Text style={styles.link}>Voltar para entrar</Text>
            </TouchableOpacity>
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
  heading: {
    marginBottom: Theme.spacing.xl,
  },
  title: {
    color: Theme.colors.primary,
    fontSize: Theme.typography.title,
    fontWeight: '700',
  },
  description: {
    marginTop: Theme.spacing.sm,
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.body,
    lineHeight: 24,
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
  success: {
    marginBottom: Theme.spacing.md,
    color: Theme.colors.success,
    fontSize: Theme.typography.small,
    lineHeight: 21,
  },
  linkButton: {
    alignSelf: 'center',
    marginTop: Theme.spacing.lg,
    paddingVertical: Theme.spacing.xs,
  },
  link: {
    color: Theme.colors.primary,
    fontSize: Theme.typography.small,
    fontWeight: '600',
  },
});
