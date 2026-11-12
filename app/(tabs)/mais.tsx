  import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
  import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
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
import { useCurrentUserProfile } from '../../hooks/useCurrentUserProfile';

  import { getLinks } from '../../services/config';
  import { logout } from '../../services/auth';

  export default function MaisScreen() {
    const { user } = useCurrentUserProfile();
    const [links, setLinks] =
      useState<any>(null);

    const [offline, setOffline] =
      useState(false);

    const [refreshing, setRefreshing] =
      useState(false);

    const [saindo, setSaindo] =
      useState(false);

    const carregarLinks = useCallback(async () => {
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
    }, []);

    useEffect(() => {
      let active = true;

      getLinks()
        .then((resultado) => {
          if (!active) return;
          setOffline(resultado.offline);
          setLinks(resultado.data);
        })
        .catch((error) => {
          if (!active) return;
          console.error('Erro ao carregar links:', error);
        });

      return () => {
        active = false;
      };
    }, []);

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

    async function sair() {
      if (saindo) return;

      setSaindo(true);

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
        setSaindo(false);
      }
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

          <Pressable
            onPress={() => router.push('/pedidosOracao')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#F8F7F3',
              borderRadius: 18,
              marginHorizontal: 16,
              marginBottom: 16,
              padding: 18,
            }}
          >
            <Ionicons name="heart-outline" size={26} color="#023411" />
            <Text
              style={{
                flex: 1,
                marginLeft: 12,
                color: '#023411',
                fontSize: 14,
                fontWeight: '700',
              }}
            >
              Pedidos de oração
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#546B5F" />
          </Pressable>

          {user ? (
            <Pressable
              onPress={() => router.push('/perfil')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#F8F7F3',
                borderRadius: 18,
                marginHorizontal: 16,
                marginBottom: 16,
                padding: 18,
              }}
            >
              <Ionicons name="person-circle-outline" size={28} color="#023411" />
              <Text
                style={{
                  flex: 1,
                  marginLeft: 12,
                  color: '#023411',
                  fontSize: 14,
                  fontWeight: '700',
                }}
              >
                Meu Perfil
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#546B5F" />
            </Pressable>
          ) : null}

          {user ? (
            <Pressable
              onPress={() => router.push('/anotacoes')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#F8F7F3',
                borderRadius: 18,
                marginHorizontal: 16,
                marginBottom: 16,
                padding: 18,
              }}
            >
              <Ionicons name="document-text-outline" size={26} color="#023411" />
              <Text
                style={{
                  flex: 1,
                  marginLeft: 12,
                  color: '#023411',
                  fontSize: 14,
                  fontWeight: '700',
                }}
              >
                Minhas anotações
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#546B5F" />
            </Pressable>
          ) : null}

          {user?.ativo && user.perfil === 'ADMINISTRADOR' ? (
            <Pressable
              onPress={() => router.push('/admin/conteudo')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#F8F7F3',
                borderRadius: 18,
                marginHorizontal: 16,
                marginBottom: 16,
                padding: 18,
              }}
            >
              <Ionicons name="settings-outline" size={26} color="#023411" />
              <Text
                style={{
                  flex: 1,
                  marginLeft: 12,
                  color: '#023411',
                  fontSize: 14,
                  fontWeight: '700',
                }}
              >
                Gerenciar avisos e eventos
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#546B5F" />
            </Pressable>
          ) : null}

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

          <Pressable
            onPress={sair}
            disabled={saindo}
            accessibilityRole="button"
            accessibilityState={{ disabled: saindo }}
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#023411',
              borderRadius: 16,
              marginHorizontal: 24,
              marginTop: 24,
              paddingVertical: 14,
              opacity: saindo ? 0.6 : 1,
            }}
          >
            <Ionicons
              name="log-out-outline"
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
              {saindo ? 'Saindo...' : 'Sair da conta'}
            </Text>
          </Pressable>
        </RefreshableScroll>
      </Screen>
    );
  }      