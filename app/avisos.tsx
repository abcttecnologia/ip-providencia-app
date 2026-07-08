import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import AppCard from '../components/ui/AppCard';
import AppHeader from '../components/ui/AppHeader';
import EmptyState from '../components/ui/EmptyState';
import OfflineBanner from '../components/ui/OfflineBanner';
import RefreshableScroll from '../components/ui/RefreshableScroll';
import Screen from '../components/ui/Screen';
import ScreenLoader from '../components/ui/ScreenLoader';

import { Aviso, getAvisos } from '../services/avisos';

export default function AvisosScreen() {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    carregarAvisos();
  }, []);

  async function carregarAvisos() {
    try {
      const resultado = await getAvisos();

      setOffline(resultado.offline);

      const dados = resultado.data;

      dados.sort((a, b) => {
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

  async function atualizar() {
    setRefreshing(true);

    try {
      await carregarAvisos();
    } finally {
      setRefreshing(false);
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

                <Text
                  style={{
                    fontSize: 14,
                    color: '#555',
                    lineHeight: 24,
                  }}
                >
                  {aviso.descricao}
                </Text>

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