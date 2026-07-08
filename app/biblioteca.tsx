import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  Text,
  View,
} from 'react-native';

import AppCard from '../components/ui/AppCard';
import AppHeader from '../components/ui/AppHeader';
import EmptyState from '../components/ui/EmptyState';
import OfflineBanner from '../components/ui/OfflineBanner';
import RefreshableScroll from '../components/ui/RefreshableScroll';
import Screen from '../components/ui/Screen';
import ScreenLoader from '../components/ui/ScreenLoader';

import { getBiblioteca } from '../services/biblioteca';

type Material = {
  id: string;
  titulo: string;
  descricao: string;
  url: string;
  ativo: boolean;
};

export default function BibliotecaScreen() {
  const [materiais, setMateriais] =
    useState<Material[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [offline, setOffline] =
    useState(false);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    try {
      const resultado =
        await getBiblioteca();

      setOffline(resultado.offline);

      setMateriais(
        resultado.data.filter(
          (item: Material) => item.ativo
        )
      );
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  async function atualizar() {
    setRefreshing(true);

    try {
      await carregar();
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />

        <Screen>
          <ScreenLoader
            message="Carregando biblioteca..."
          />
        </Screen>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <Screen>
        <AppHeader title="Biblioteca" />

        <OfflineBanner
          visible={offline}
        />

        <RefreshableScroll
          refreshing={refreshing}
          onRefresh={atualizar}
          contentContainerStyle={{
            padding: 20,
            paddingBottom: 40,
          }}
        >
                    {materiais.length === 0 ? (
            <EmptyState
              icon="library-outline"
              title="Nenhum material"
              description="Ainda não há materiais disponíveis."
            />
          ) : (
            materiais.map((item) => (
              <AppCard key={item.id}>
                <Pressable
                  onPress={async () => {
                    const supported =
                      await Linking.canOpenURL(
                        item.url
                      );

                    if (supported) {
                      await Linking.openURL(
                        item.url
                      );
                    } else {
                      Alert.alert(
                        'Erro',
                        'Não foi possível abrir este arquivo.'
                      );
                    }
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons
                    name="book-outline"
                    size={34}
                    color="#023411"
                  />

                  <View
                    style={{
                      flex: 1,
                      marginLeft: 16,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: '700',
                        color: '#023411',
                      }}
                    >
                      {item.titulo}
                    </Text>

                    <Text
                      style={{
                        fontSize: 13,
                        color: '#777',
                        marginTop: 4,
                        lineHeight: 18,
                      }}
                    >
                      {item.descricao}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={24}
                    color="#023411"
                  />
                </Pressable>
              </AppCard>
            ))
          )}
        </RefreshableScroll>
      </Screen>
    </>
  );
}          