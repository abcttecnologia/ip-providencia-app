import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  Text,
  View,
} from 'react-native';

import AppHeader from '../components/ui/AppHeader';
import Screen from '../components/ui/Screen';
import { useCurrentUserProfile } from '../hooks/useCurrentUserProfile';
import { logout } from '../services/auth';

export default function ConfiguracoesScreen() {
  const { user } = useCurrentUserProfile();
  const [signingOut, setSigningOut] = useState(false);

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
      </View>
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
