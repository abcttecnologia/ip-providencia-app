import { useEffect, useState } from 'react';
import {
  ScrollView,
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

import { getEventos } from '../services/calendar';

interface EventoGoogle {
  id: string;
  summary: string;

  start: {
    date?: string;
    dateTime?: string;
  };
}

type TipoAgenda =
  | 'pequenosGrupos'
  | 'cultos'
  | 'oracao'
  | 'ebd'
  | 'eventos';

export default function AgendaScreen() {
  const [tipoSelecionado, setTipoSelecionado] =
    useState<TipoAgenda>('cultos');

  const [eventos, setEventos] =
    useState<EventoGoogle[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [offline, setOffline] =
    useState(false);

  useEffect(() => {
    carregarEventos();
  }, []);

  async function carregarEventos() {
    try {
      const resultado = await getEventos();

      setOffline(resultado.offline);

      setEventos(resultado.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  async function atualizar() {
    setRefreshing(true);

    try {
      await carregarEventos();
    } finally {
      setRefreshing(false);
    }
  }

  function filtrarEventos(
    eventos: EventoGoogle[]
  ) {
    if (tipoSelecionado === 'pequenosGrupos') {
      return eventos.filter((evento) => {
        const titulo =
          evento.summary?.toLowerCase() || '';

        return (
          titulo.includes('pg') ||
          titulo.includes('pequeno grupo') ||
          titulo.includes('pequenos grupos')
        );
      });
    }

        return eventos.filter((evento) => {
      const titulo =
        evento.summary?.toLowerCase() || '';

      if (tipoSelecionado === 'cultos') {
        return titulo.includes('culto');
      }

      if (tipoSelecionado === 'oracao') {
        return (
          titulo.includes('oração') ||
          titulo.includes('oracao')
        );
      }

      if (tipoSelecionado === 'ebd') {
        return (
          titulo.includes('ebd') ||
          titulo.includes('escola bíblica') ||
          titulo.includes('escola biblica')
        );
      }

      if (tipoSelecionado === 'eventos') {
        return (
          !titulo.includes('culto') &&
          !titulo.includes('oração') &&
          !titulo.includes('oracao') &&
          !titulo.includes('ebd') &&
          !titulo.includes('escola bíblica') &&
          !titulo.includes('escola biblica') &&
          !titulo.includes('pg') &&
          !titulo.includes('pequeno grupo') &&
          !titulo.includes('pequenos grupos')
        );
      }

      return true;
    });
  }

  if (loading) {
    return (
      <Screen>
        <ScreenLoader message="Carregando agenda..." />
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader title="Agenda" />

      <OfflineBanner visible={offline} />

      <RefreshableScroll
        refreshing={refreshing}
        onRefresh={atualizar}
        contentContainerStyle={{
          paddingBottom: 20,
        }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            gap: 6,
            paddingTop: 16,
            paddingBottom: 20,
          }}
        >
          {[
            {
              id: 'cultos',
              titulo: 'Cultos',
            },
            {
              id: 'ebd',
              titulo: 'EBD',
            },
            {
              id: 'oracao',
              titulo: 'Oração',
            },
            {
              id: 'pequenosGrupos',
              titulo: 'PGs',
            },
            {
              id: 'eventos',
              titulo: 'Eventos',
            },
          ].map((aba) => (
             <Text
              key={aba.id}
              onPress={() =>
                setTipoSelecionado(
                  aba.id as TipoAgenda
                )
              }
              style={{
                backgroundColor:
                  tipoSelecionado === aba.id
                    ? '#023411'
                    : '#D5DED6',

                color:
                  tipoSelecionado === aba.id
                    ? '#FFFFFF'
                    : '#023411',

                paddingHorizontal: 8,
                paddingVertical: 6,
                borderRadius: 16,

                fontSize: 12,
                fontWeight: '700',
              }}
            >
              {aba.titulo}
            </Text>
          ))}
        </ScrollView>

        {filtrarEventos(eventos).length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="Nenhum evento"
            description="Não há eventos nesta categoria."
          />
        ) : (
          filtrarEventos(eventos).map((evento) => {
            const data = new Date(
              evento.start?.dateTime ||
                evento.start?.date ||
                ''
            );

            return (
              <AppCard
                key={evento.id}
                style={{
                  flexDirection: 'row',
                  backgroundColor: '#F4F1E8',

                  paddingVertical: 14,
                  paddingHorizontal: 10,

                  marginHorizontal: 16,
                  marginBottom: 8,
                }}
              >
                <View
                  style={{
                    width: 60,
                    alignItems: 'center',
                    justifyContent: 'center',

                    marginRight: 10,

                    borderRightWidth: 1,
                    borderRightColor: '#DDDDDD',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 28,
                      fontWeight: '800',
                      color: '#023411',
                    }}
                  >
                    {data.getDate()}
                  </Text>

                  <Text
                    style={{
                      fontSize: 9,
                      color: '#666',
                      textTransform: 'capitalize',
                    }}
                  >
                    {data.toLocaleDateString(
                      'pt-BR',
                      {
                        month: 'short',
                      }
                    )}
                  </Text>
                </View>

                <View
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      color: '#777',
                      marginBottom: 2,
                    }}
                  >
                    {data.toLocaleDateString(
                      'pt-BR',
                      {
                        weekday: 'long',
                      }
                    )}
                    {' • '}
                    {data.toLocaleTimeString(
                      'pt-BR',
                      {
                        hour: '2-digit',
                        minute: '2-digit',
                      }
                    )}
                  </Text>

                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '700',
                      color: '#023411',
                    }}
                  >
                    {evento.summary}
                  </Text>
                </View>

                <View
                  style={{
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      color: '#999',
                    }}
                  >
                    ›
                  </Text>
                </View>
              </AppCard>
            );
          })
        )}
      </RefreshableScroll>
    </Screen>
  );
}           