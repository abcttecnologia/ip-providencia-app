import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import AppHeader from '../components/ui/AppHeader';
import Screen from '../components/ui/Screen';
import { useCurrentUserProfile } from '../hooks/useCurrentUserProfile';
import { logout } from '../services/auth';
import {
  deleteCurrentAuthAccount,
  prepareAccountDeletion,
  reauthenticateAndDeleteCurrentAuthAccount,
} from '../services/accountDeletion';

export default function ConfiguracoesScreen() {
  const { user } = useCurrentUserProfile();
  const [signingOut, setSigningOut] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [accountDataPrepared, setAccountDataPrepared] = useState(false);
  const [passwordPrompt, setPasswordPrompt] = useState(false);
  const [password, setPassword] = useState('');
  const [deletionError, setDeletionError] = useState('');

  function confirmAccountDeletion() {
    Alert.alert(
      'Excluir minha conta e meus dados',
      'Esta ação não pode ser desfeita. Seus dados pessoais e pedidos de oração serão apagados; os registros pastorais elegíveis serão anonimizados pela igreja.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar',
          style: 'destructive',
          onPress: () =>
            Alert.alert(
              'Confirmação final',
              'Confirma a exclusão definitiva da sua conta?',
              [
                { text: 'Voltar', style: 'cancel' },
                {
                  text: 'Excluir definitivamente',
                  style: 'destructive',
                  onPress: () => void performAccountDeletion(),
                },
              ],
            ),
        },
      ],
    );
  }

  async function performAccountDeletion() {
    if (deletingAccount) return;
    setDeletingAccount(true);
    setDeletionError('');
    try {
      if (!accountDataPrepared) {
        await prepareAccountDeletion();
        setAccountDataPrepared(true);
      }
      await deleteCurrentAuthAccount();
      router.replace('/welcome');
    } catch (error) {
      console.error('Falha ao excluir a conta:', error);
      const code =
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        typeof error.code === 'string'
          ? error.code
          : '';
      if (code === 'auth/requires-recent-login' && accountDataPrepared) {
        setPasswordPrompt(true);
        setDeletionError('');
      } else if (code === 'auth/requires-recent-login') {
        setAccountDataPrepared(true);
        setPasswordPrompt(true);
        setDeletionError('');
      } else {
        setDeletionError(
          accountDataPrepared
            ? 'Os dados foram removidos e a solicitação foi registrada, mas não foi possível excluir o acesso. Tente novamente.'
            : 'Não foi possível concluir a exclusão. A solicitação pode já ter sido registrada; tente novamente para continuar.',
        );
      }
    } finally {
      setDeletingAccount(false);
    }
  }

  async function confirmPasswordAndDelete() {
    if (!password || deletingAccount) return;
    setDeletingAccount(true);
    setDeletionError('');
    try {
      await reauthenticateAndDeleteCurrentAuthAccount(password);
      setPasswordPrompt(false);
      setPassword('');
      router.replace('/welcome');
    } catch (error) {
      console.error('Falha ao reautenticar para excluir a conta:', error);
      setDeletionError(
        error instanceof Error && 'code' in error &&
          error.code === 'auth/wrong-password'
          ? 'A senha está incorreta. Tente novamente.'
          : 'Não foi possível confirmar a senha ou excluir a conta.',
      );
    } finally {
      setDeletingAccount(false);
    }
  }

  async function openDeviceSettings() {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error('Não foi possível abrir as configurações do dispositivo:', error);
      Alert.alert(
        'Configurações indisponíveis',
        'Abra as configurações do aplicativo pelo sistema do celular.',
      );
    }
  }

  async function signOut() {
    if (signingOut) return;

    setSigningOut(true);
    try {
      await logout();
      router.replace('/welcome');
    } catch (error) {
      console.error('Erro ao sair da conta:', error);
      Alert.alert(
        'Não foi possível sair',
        'Tente novamente em alguns instantes.',
      );
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <Screen>
      <AppHeader title="Configurações" />
      <View style={{ padding: 16 }}>
        <Text
          style={{
            color: '#546B5F',
            fontSize: 14,
            lineHeight: 21,
            marginBottom: 18,
          }}
        >
          Ajuste as preferências do aplicativo e da sua conta.
        </Text>

        <View style={{ backgroundColor: '#F8F7F3', borderRadius: 18 }}>
          <SettingsRow
            icon="notifications-outline"
            title="Notificações"
            description="Gerencie as permissões no celular"
            onPress={openDeviceSettings}
          />
          <SettingsRow
            icon="shield-checkmark-outline"
            title="Privacidade"
            description="Leia a política de privacidade"
            onPress={() => router.push('/politica')}
          />
          <SettingsRow
            icon="person-outline"
            title="Meu Perfil"
            description="Consulte e atualize seus dados"
            onPress={() => router.push('/perfil')}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={signingOut}
          onPress={() => {
            if (user) {
              void signOut();
            } else {
              router.push('/login');
            }
          }}
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#023411',
            borderRadius: 16,
            marginTop: 24,
            paddingVertical: 14,
            opacity: signingOut ? 0.6 : 1,
          }}
        >
          <Ionicons
            name={user ? 'log-out-outline' : 'log-in-outline'}
            size={20}
            color="#FFFFFF"
          />
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: '700',
              marginLeft: 8,
            }}
          >
            {signingOut
              ? 'Saindo...'
              : user
                ? 'Sair da conta'
                : 'Entrar na conta'}
          </Text>
        </Pressable>

        {user ? (
          <Pressable
            accessibilityRole="button"
            disabled={deletingAccount || signingOut}
            onPress={confirmAccountDeletion}
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              borderColor: '#B3261E',
              borderWidth: 1,
              borderRadius: 16,
              marginTop: 16,
              paddingVertical: 14,
              opacity: deletingAccount ? 0.6 : 1,
            }}
          >
            {deletingAccount ? (
              <ActivityIndicator color="#B3261E" />
            ) : (
              <Ionicons name="trash-outline" size={20} color="#B3261E" />
            )}
            <Text
              style={{
                color: '#B3261E',
                fontSize: 14,
                fontWeight: '700',
                marginLeft: 8,
              }}
            >
              Excluir minha conta e meus dados
            </Text>
          </Pressable>
        ) : null}
        {deletionError ? (
          <Text style={{ color: '#B3261E', marginTop: 12, fontSize: 12 }}>
            {deletionError}
          </Text>
        ) : null}
      </View>

      <Modal
        visible={passwordPrompt}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setPasswordPrompt(false);
          setPassword('');
        }}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            padding: 24,
            backgroundColor: 'rgba(0,0,0,0.45)',
          }}
        >
          <View
            style={{
              padding: 20,
              borderRadius: 16,
              backgroundColor: '#FFFFFF',
            }}
          >
            <Text style={{ color: '#023411', fontSize: 18, fontWeight: '700' }}>
              Confirme sua senha
            </Text>
            <Text style={{ color: '#546B5F', marginTop: 8, lineHeight: 20 }}>
              Por segurança, entre novamente para concluir a exclusão da conta.
            </Text>
            <TextInput
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                setDeletionError('');
              }}
              placeholder="Senha"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!deletingAccount}
              style={{
                minHeight: 48,
                marginTop: 16,
                paddingHorizontal: 12,
                borderWidth: 1,
                borderColor: '#D5DED6',
                borderRadius: 10,
              }}
            />
            {deletionError ? (
              <Text style={{ color: '#B3261E', marginTop: 8, fontSize: 12 }}>
                {deletionError}
              </Text>
            ) : null}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 18 }}>
              <Pressable
                disabled={deletingAccount}
                onPress={() => {
                  setPasswordPrompt(false);
                  setPassword('');
                  setDeletionError('');
                }}
                style={{ padding: 10 }}
              >
                <Text style={{ color: '#546B5F', fontWeight: '600' }}>Cancelar</Text>
              </Pressable>
              <Pressable
                disabled={deletingAccount || !password}
                onPress={() => void confirmPasswordAndDelete()}
                style={{ padding: 10, opacity: !password ? 0.5 : 1 }}
              >
                <Text style={{ color: '#B3261E', fontWeight: '700' }}>
                  {deletingAccount ? 'Excluindo...' : 'Confirmar exclusão'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function SettingsRow({
  icon,
  title,
  description,
  onPress,
}: {
  icon: 'notifications-outline' | 'shield-checkmark-outline' | 'person-outline';
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        minHeight: 72,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <Ionicons name={icon} size={22} color="#1A3F12" />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ color: '#023411', fontSize: 14, fontWeight: '700' }}>
          {title}
        </Text>
        <Text style={{ color: '#546B5F', fontSize: 12, marginTop: 3 }}>
          {description}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#546B5F" />
    </Pressable>
  );
}
