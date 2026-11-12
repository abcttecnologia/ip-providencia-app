import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  Text,
  View,
} from 'react-native';
import type { ComponentProps } from 'react';

import AppHeader from '../../components/ui/AppHeader';
import OfflineBanner from '../../components/ui/OfflineBanner';
import RefreshableScroll from '../../components/ui/RefreshableScroll';
import Screen from '../../components/ui/Screen';
import { useCurrentUserProfile } from '../../hooks/useCurrentUserProfile';
import { logout } from '../../services/auth';
import { getLinks } from '../../services/config';
import type { ConfigLinks } from '../../types/firestore';

type IconName = ComponentProps<typeof Ionicons>['name'];
type CommunityRoute =
  | '/perfil'
  | '/familia'
  | '/ministerios'
  | '/pequenosGrupos'
  | '/pedidosOracao'
  | '/ebd'
  | '/anotacoes';

type Resource = {
  title: string;
  icon: IconName;
  route?: CommunityRoute;
  access: 'all' | 'member' | 'signedIn';
  action?: 'clubeBiblia';
};

const RESOURCES: Resource[] = [
  {
    title: 'Meu Perfil',
    icon: 'person-outline',
    route: '/perfil',
    access: 'all',
  },
  {
    title: 'Minha Família',
    icon: 'home-outline',
    route: '/familia',
    access: 'member',
  },
  {
    title: 'Ministérios',
    icon: 'people-circle-outline',
    route: '/ministerios',
    access: 'member',
  },
  {
    title: 'Pequenos Grupos',
    icon: 'people-outline',
    route: '/pequenosGrupos',
    access: 'all',
  },
  {
    title: 'Pedidos de oração',
    icon: 'heart-outline',
    route: '/pedidosOracao',
    access: 'all',
  },
  {
    title: 'Minha EBD',
    icon: 'book-outline',
    route: '/ebd',
    access: 'member',
  },
  {
    title: 'Plano Bíblico',
    icon: 'reader-outline',
    access: 'all',
    action: 'clubeBiblia',
  },
  {
    title: 'Minhas anotações',
    icon: 'create-outline',
    route: '/anotacoes',
    access: 'signedIn',
  },
];

export default function ComunhaoScreen() {
  const { user } = useCurrentUserProfile();
  const [links, setLinks] = useState<ConfigLinks | null>(null);
  const [offline, setOffline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const isMember =
    user?.ativo === true &&
    (user.perfil === 'MEMBRO' || user.perfil === 'ADMINISTRADOR');
  const isAdmin = user?.ativo === true && user.perfil === 'ADMINISTRADOR';

  const loadLinks = useCallback(async () => {
    const result = await getLinks();
    setLinks(result.data);
    setOffline(result.offline);
  }, []);

  useEffect(() => {
    let active = true;

    getLinks()
      .then((result) => {
        if (!active) return;
        setLinks(result.data);
        setOffline(result.offline);
      })
      .catch((error) => {
        if (!active) return;
        console.error('Erro ao carregar links da Comunhão:', error);
      });

    return () => {
      active = false;
    };
  }, []);

  async function refresh() {
    setRefreshing(true);
    try {
      await loadLinks();
    } catch (error) {
      console.error('Erro ao atualizar recursos da Comunhão:', error);
    } finally {
      setRefreshing(false);
    }
  }

  async function openExternalLink(url?: string) {
    if (!url) {
      Alert.alert('Link indisponível', 'Este link ainda não foi configurado.');
      return;
    }

    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Erro ao abrir link externo:', error);
      Alert.alert('Não foi possível abrir', 'Tente novamente mais tarde.');
    }
  }

  function openAbout() {
    router.push({
      pathname: '/player',
      params: {
        videoId: 'aTeBjtr85-0',
        titulo: 'Sobre Nós',
      },
    });
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

  function openResource(resource: Resource) {
    if (resource.action === 'clubeBiblia') {
      void openExternalLink(links?.clubeBiblia);
      return;
    }
    if (resource.route) router.push(resource.route);
  }

  const resources = RESOURCES.filter((resource) => {
    if (resource.access === 'member') return isMember;
    if (resource.access === 'signedIn') return Boolean(user);
    return true;
  });

  return (
    <Screen>
      <AppHeader title="Comunhão" showBack={false} />
      <OfflineBanner visible={offline} />
      <RefreshableScroll
        refreshing={refreshing}
        onRefresh={refresh}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
      >
        <Text
          style={{
            color: '#546B5F',
            fontSize: 14,
            lineHeight: 21,
            marginTop: 16,
            marginBottom: 20,
          }}
        >
          Encontre pessoas, grupos e recursos para caminhar em comunidade.
        </Text>

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            rowGap: 12,
          }}
        >
          {resources.map((resource) => (
            <Pressable
              key={resource.title}
              accessibilityRole="button"
              onPress={() => openResource(resource)}
              style={{
                width: '48%',
                minHeight: 112,
                padding: 14,
                borderRadius: 18,
                backgroundColor: '#F8F7F3',
                justifyContent: 'space-between',
              }}
            >
              <Ionicons name={resource.icon} size={24} color="#1A3F12" />
              <Text
                style={{
                  color: '#023411',
                  fontSize: 13,
                  fontWeight: '700',
                  marginTop: 12,
                }}
              >
                {resource.title}
              </Text>
            </Pressable>
          ))}
        </View>

        {isAdmin ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/admin/conteudo')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#E1E9DE',
              borderRadius: 16,
              marginTop: 18,
              padding: 16,
            }}
          >
            <Ionicons name="settings-outline" size={22} color="#023411" />
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
            <Ionicons name="chevron-forward" size={18} color="#546B5F" />
          </Pressable>
        ) : null}

        <Text
          style={{
            color: '#023411',
            fontSize: 16,
            fontWeight: '800',
            marginTop: 28,
            marginBottom: 12,
          }}
        >
          Mais recursos
        </Text>
        <View style={{ backgroundColor: '#F8F7F3', borderRadius: 18 }}>
          <ResourceLink
            icon="notifications-outline"
            title="Avisos"
            onPress={() => router.push('/avisos')}
          />
          <ResourceLink
            icon="location-outline"
            title="Como chegar"
            onPress={() => void openExternalLink(links?.mapa)}
          />
          <ResourceLink
            icon="logo-instagram"
            title="Instagram"
            onPress={() => void openExternalLink(links?.instagram)}
          />
          <ResourceLink
            icon="book-outline"
            title="Clube da Bíblia"
            onPress={() => void openExternalLink(links?.clubeBiblia)}
          />
          <ResourceLink
            icon="play-circle-outline"
            title="Sobre Nós"
            onPress={openAbout}
          />
          <ResourceLink
            icon="library-outline"
            title="Biblioteca"
            onPress={() => router.push('/biblioteca')}
          />
          <ResourceLink
            icon="musical-notes-outline"
            title="Hinário"
            onPress={() => router.push('/hinario')}
          />
          <ResourceLink
            icon="document-text-outline"
            title="Política de Privacidade"
            onPress={() => router.push('/politica')}
          />
          <ResourceLink
            icon="heart-circle-outline"
            title="Dízimos"
            onPress={() => router.push('/dizimos')}
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
      </RefreshableScroll>
    </Screen>
  );
}

function ResourceLink({
  icon,
  title,
  onPress,
}: {
  icon: IconName;
  title: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        minHeight: 52,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <Ionicons name={icon} size={20} color="#1A3F12" />
      <Text
        style={{
          flex: 1,
          marginLeft: 12,
          color: '#023411',
          fontSize: 13,
          fontWeight: '600',
        }}
      >
        {title}
      </Text>
      <Ionicons name="chevron-forward" size={18} color="#546B5F" />
    </Pressable>
  );
}
