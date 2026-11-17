import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, Text, View } from 'react-native';
import Hyperlink from 'react-native-hyperlink';

import AppCard from '../components/ui/AppCard';
import AppHeader from '../components/ui/AppHeader';
import EmptyState from '../components/ui/EmptyState';
import OfflineBanner from '../components/ui/OfflineBanner';
import RefreshableScroll from '../components/ui/RefreshableScroll';
import Screen from '../components/ui/Screen';
import ScreenLoader from '../components/ui/ScreenLoader';

import { Aviso, deleteAviso, getAvisos } from '../services/avisos';
import { useCurrentUserProfile } from '../hooks/useCurrentUserProfile';

export default function AvisosScreen() {
  const { user } = useCurrentUserProfile();
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);
  const canManage =
    user?.ativo === true &&
    (user.perfil === 'ADMINISTRADOR' ||
      user.funcoes?.includes('SECRETARIA'));

  async function carregarAvisos() {
    try {
      const resultado = await getAvisos();

      setOffline(resultado.offline);

      const dados = resultado.data;

      dados.sort((a: any, b: any) => {
        if (a.importante === b.importante) return 0;
        return a.importante ? -1 : 1;
      });

      setAvisos(dados);
    } catch (error) {
      console.log('ERRO AO CARREGAR AVISOS:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => void carregarAvisos(), 0);
    return () => clearTimeout(timer);
  }, []);

  async function atualizar() {
    setRefreshing(true);
    try {
      await carregarAvisos();
    } finally {
      setRefreshing(false);
    }
  }

  function confirmDelete(aviso: Aviso) {
    Alert.alert(
      'Excluir aviso?',
      'Essa ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => void removeAviso(aviso),
        },
      ],
    );
  }

  async function removeAviso(aviso: Aviso) {
    try {
      await deleteAviso(aviso.id);
      setAvisos((current) => current.filter((item) => item.id !== aviso.id));
      Alert.alert('Excluído', 'O aviso foi excluído.');
    } catch (deleteError) {
      console.error('Falha ao excluir aviso:', deleteError);
      Alert.alert(
        'Não foi possível excluir',
        deleteError instanceof Error
          ? deleteError.message
          : 'Tente novamente em alguns instantes.',
      );
    }
  }

  if (loading) {
    return (
      <Screen>
        <ScreenLoader message="Carregando avisos..." />
      </Screen>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <Screen>
        <AppHeader title="Avisos" />

        <OfflineBanner visible={offline} />

        <RefreshableScroll
          refreshing={refreshing}
          onRefresh={atualizar}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 40,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              color: '#546B5F',
              textAlign: 'center',
              marginBottom: 22,
              paddingHorizontal: 20,
              lineHeight: 18,
            }}
          >
            Acompanhe os comunicados e informações importantes da Igreja.
          </Text>

          {avisos.length === 0 ? (
            <EmptyState
              icon="notifications-off-outline"
              title="Nenhum aviso"
              description="Não há avisos publicados no momento."
            />
          ) : (
            avisos.map((aviso) => (
              <AppCard
                key={aviso.id}
                style={{
                  borderLeftWidth: aviso.importante ? 6 : 0,
                  borderLeftColor: '#2E7D32',
                }}
              >
                {aviso.importante && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: 10,
                    }}
                  >
                    <Ionicons
                      name="megaphone"
                      size={16}
                      color="#2E7D32"
                    />

                    <Text
                      style={{
                        marginLeft: 6,
                        color: '#2E7D32',
                        fontWeight: '700',
                        fontSize: 10,
                      }}
                    >
                      IMPORTANTE
                    </Text>
                  </View>
                )}
                {canManage ? (
                  <Pressable
                    onPress={() => confirmDelete(aviso)}
                    accessibilityRole="button"
                    accessibilityLabel={`Excluir aviso ${aviso.titulo}`}
                    style={{ flexDirection: 'row', alignSelf: 'flex-end', alignItems: 'center', marginBottom: 8 }}
                  >
                    <Ionicons name="trash-outline" size={18} color="#B3261E" />
                    <Text style={{ color: '#B3261E', marginLeft: 6, fontWeight: '700' }}>
                      Excluir
                    </Text>
                  </Pressable>
                ) : null}

                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: '#023411',
                    marginBottom: 10,
                  }}
                >
                  {aviso.titulo}
                </Text>

<Hyperlink
  linkStyle={{
    color: '#0A7C3B',
    fontWeight: '700',
    textDecorationLine: 'underline',
  }}
  onPress={(url) => Linking.openURL(url)}
>
  <Text
    style={{
      fontSize: 14,
      color: '#555',
      lineHeight: 24,
    }}
  >
    {aviso.descricao}
  </Text>
</Hyperlink>

                {aviso.data ? (
                  <Text
                    style={{
                      marginTop: 16,
                      alignSelf: 'flex-end',
                      color: '#999',
                      fontSize: 13,
                      fontWeight: '500',
                    }}
                  >
                    {aviso.data}
                  </Text>
                ) : null}
              </AppCard>
            ))
          )}
        </RefreshableScroll>
      </Screen>
    </>
  );
}