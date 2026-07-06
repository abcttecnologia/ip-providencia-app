import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View,
} from 'react-native';

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
  | 'proximos'
  | 'cultos'
  | 'oracao'
  | 'ebd'
  | 'eventos';

export default function AgendaScreen() {
  const [tipoSelecionado, setTipoSelecionado] =
    useState<TipoAgenda>('proximos');

  const [eventos, setEventos] =
    useState<EventoGoogle[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    carregarEventos();
  }, []);

  async function carregarEventos() {
    try {
      const dados = await getEventos();
      setEventos(dados);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  function filtrarEventos(
    eventos: EventoGoogle[]
  ) {
    if (tipoSelecionado === 'proximos') {
      return eventos;
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
          !titulo.includes('escola biblica')
        );
      }

      return true;
    });
  }

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#ECE8DD',
        }}
      >
        <ActivityIndicator
          size="large"
          color="#023411"
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: '#ECE8DD',
      }}
      contentContainerStyle={{
        paddingTop: 50,
        paddingBottom: 30,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Text
        style={{
          fontSize: 20,
          fontWeight: '700',
          color: '#023411',
          textAlign: 'center',
          marginBottom: 12,
        }}
      >
        Agenda
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          gap: 6,
          paddingBottom: 12,
        }}
      >
        {[
          {
            id: 'proximos',
            titulo: 'Próximos',
          },
          {
            id: 'cultos',
            titulo: 'Cultos',
          },
          {
            id: 'oracao',
            titulo: 'Oração',
          },
          {
            id: 'ebd',
            titulo: 'EBD',
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

              paddingHorizontal: 10,
              paddingVertical: 6,

              borderRadius: 16,

              fontSize: 11,
              fontWeight: '700',
            }}
          >
            {aba.titulo}
          </Text>
        ))}
      </ScrollView>

      {filtrarEventos(eventos).map(
        (evento) => {
          const data = new Date(
            evento.start?.dateTime ||
              evento.start?.date ||
              ''
          );

          return (
            <View
              key={evento.id}
              style={{
                flexDirection: 'row',
                backgroundColor: '#F4F1E8',

                borderRadius: 16,

                paddingVertical: 8,
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
                    textTransform:
                      'uppercase',
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
                    fontSize: 13,
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
            </View>
          );
        }
      )}
    </ScrollView>
  );
}