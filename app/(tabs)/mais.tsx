  import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Linking,
  Pressable,
  Text,
  View,
  ViewStyle
} from 'react-native';

  import AppHeader from '../../components/ui/AppHeader';
import OfflineBanner from '../../components/ui/OfflineBanner';
import RefreshableScroll from '../../components/ui/RefreshableScroll';
import Screen from '../../components/ui/Screen';

  import { getLinks } from '../../services/config';

  export default function MaisScreen() {
    const [links, setLinks] =
      useState<any>(null);

    const [offline, setOffline] =
      useState(false);

    const [refreshing, setRefreshing] =
      useState(false);

    useEffect(() => {
      carregarLinks();
    }, []);

    async function carregarLinks() {
      try {
        const resultado =
          await getLinks();

        setOffline(resultado.offline);

        setLinks(resultado.data);
      } catch (error) {
        console.log(
          'Erro ao carregar links:',
          error
        );
      }
    }

    async function atualizar() {
      setRefreshing(true);

      try {
        await carregarLinks();
      } finally {
        setRefreshing(false);
      }
    }

    function abrirInstagram() {
      if (links?.instagram) {
        Linking.openURL(
          links.instagram
        );
      }
    }

    function abrirClubeBiblia() {
      if (links?.clubeBiblia) {
        Linking.openURL(
          links.clubeBiblia
        );
      }
    }

    function abrirMapa() {
      if (links?.mapa) {
        Linking.openURL(
          links.mapa
        );
      }
    }

    function abrirSobre() {
      router.push({
        pathname: '/player',
        params: {
          videoId: 'aTeBjtr85-0',
          titulo: 'Sobre Nós',
        },
      });
    }

    function abrirBiblioteca() {
      router.push('/biblioteca');
    }

    function abrirHinario() {
      router.push('/hinario');
    }

    function abrirPolitica() {
      router.push('/politica');
    }

    const cardStyle: ViewStyle = {
          width: '40%',
      height: 80,
      backgroundColor: '#F8F7F3',
      borderRadius: 18,

      justifyContent: 'center',
      alignItems: 'center',

      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
    };

    const texto = {
      marginTop: 10,
      fontSize: 12,
      fontWeight: '700' as const,
      color: '#023411',
      textAlign: 'center' as const,
    };

    return (
      <Screen>
        <AppHeader title="Nossa IPP" />

        <OfflineBanner visible={offline} />

        <RefreshableScroll
          refreshing={refreshing}
          onRefresh={atualizar}
          contentContainerStyle={{
            paddingBottom: 40,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              color: '#546B5F',
              textAlign: 'center',
              marginBottom: 24,
              paddingHorizontal: 28,
              lineHeight: 20,
            }}
          >
            Acesse conteúdos, informações e recursos da
            IP Providência.
          </Text>

          {/* Primeira linha */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <Pressable
              onPress={abrirInstagram}
              style={[cardStyle, { marginRight: 12 }]}
            >
              <Ionicons
                name="logo-instagram"
                size={28}
                color="#023411"
              />

              <Text style={texto}>
                Instagram
              </Text>
            </Pressable>

            <Pressable
              onPress={abrirClubeBiblia}
              style={cardStyle}
            >
              <Ionicons
                name="book-outline"
                size={28}
                color="#023411"
              />

              <Text style={texto}>
                Clube da Bíblia
              </Text>
            </Pressable>
          </View>

          {/* Segunda linha */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <Pressable
              onPress={abrirMapa}
              style={[cardStyle, { marginRight: 12 }]}
            >
              <Ionicons
                name="location-outline"
                size={28}
                color="#023411"
              />

              <Text style={texto}>
                Como chegar
              </Text>
            </Pressable>
                <Pressable
              onPress={() => router.push('/avisos')}
              style={cardStyle}
            >
              <Ionicons
                name="notifications-outline"
                size={28}
                color="#023411"
              />

              <Text style={texto}>
                Avisos
              </Text>
            </Pressable>
          </View>

          {/* Terceira linha */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <Pressable
              onPress={abrirSobre}
              style={[
                cardStyle,
                { marginRight: 12 },
              ]}
            >
              <Ionicons
                name="play-circle-outline"
                size={28}
                color="#023411"
              />

              <Text style={texto}>
                Sobre Nós
              </Text>
            </Pressable>

            <Pressable
              onPress={abrirBiblioteca}
              style={cardStyle}
            >
              <Ionicons
                name="library-outline"
                size={28}
                color="#023411"
              />

              <Text style={texto}>
                Biblioteca
              </Text>
            </Pressable>
          </View>

          {/* Quarta linha */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
            }}
          >
            <Pressable
              onPress={abrirHinario}
              style={[
                cardStyle,
                { marginRight: 12 },
              ]}
            >
              <Ionicons
                name="musical-notes-outline"
                size={20}
                color="#023411"
              />

              <Text style={texto}>
                Hinário
              </Text>
            </Pressable>

            <Pressable
              onPress={abrirPolitica}
              style={cardStyle}
            >
              <Ionicons
                name="document-text-outline"
                size={28}
                color="#023411"
              />

              <Text style={texto}>
                Política
              </Text>
            </Pressable>
          </View>
        </RefreshableScroll>
      </Screen>
    );
  }      