import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { getEventos } from '../../services/eventos';

export default function EventosScreen() {
  const [eventos, setEventos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarEventos();
  }, []);

 async function carregarEventos() {
  try {
    const dados = await getEventos();

    console.log(dados);

    setEventos(
      dados.filter((item: any) => item.ativo)
    );
  } catch (error) {
    console.log(error);
  } finally {
    setLoading(false);
  }
}

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#ECE8DD',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator
          size="large"
          color="#023411"
        />
      </View>
    );
  }

  if (eventos.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#ECE8DD',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 30,
        }}
      >
        <Ionicons
          name="calendar-outline"
          size={60}
          color="#546B5F"
        />

        <Text
          style={{
            marginTop: 20,
            fontSize: 18,
            color: '#546B5F',
            fontWeight: '600',
            textAlign: 'center',
          }}
        >
          Nenhum evento disponível.
        </Text>

        <Text
          style={{
            marginTop: 8,
            fontSize: 14,
            color: '#666',
            textAlign: 'center',
            lineHeight: 22,
          }}
        >
          Em breve teremos novas campanhas e programações da igreja.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#ECE8DD',
      }}
    >
      <ScrollView
        style={{
          flex: 1,
        }}
        contentContainerStyle={{
          paddingBottom: 30,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            backgroundColor: '#023411',
            paddingTop: 55,
            paddingBottom: 16,
            paddingHorizontal: 18,
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 18,
          }}
        >
          <Pressable onPress={() => router.back()}>
            <Ionicons
              name="arrow-back"
              size={24}
              color="#FFF"
            />
          </Pressable>

          <Text
            style={{
              flex: 1,
              textAlign: 'center',
              color: '#FFF',
              fontSize: 20,
              fontWeight: '800',
              marginRight: 24,
            }}
          >
            Eventos
          </Text>
        </View>

        <Text
          style={{
            fontSize: 14,
            color: '#546B5F',
            textAlign: 'center',
            marginBottom: 22,
            paddingHorizontal: 28,
            lineHeight: 20,
          }}
        >
          Acompanhe os eventos, campanhas e programações especiais da Igreja.
        </Text>
               {eventos.map((evento) => (
          <Pressable
            key={evento.id}
            onPress={() =>
              router.push({
                pathname: '/eventos',
                params: {
                  id: evento.id,
                },
              })
            }
            style={{
              marginHorizontal: 16,
              marginBottom: 16,
              backgroundColor: '#FFF',
              borderRadius: 22,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',

              shadowColor: '#000',
              shadowOpacity: 0.06,
              shadowRadius: 6,
              shadowOffset: {
                width: 0,
                height: 2,
              },
              elevation: 3,
            }}
          >
<Image
  source={{ uri: evento.imagem }}
  style={{
    width: 90,
    height: 70,
    borderRadius: 12,
  }}
  resizeMode="cover"
/>

            <View
              style={{
                flex: 1,
                marginLeft: 14,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  color: '#546B5F',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  marginBottom: 4,
                }}
              >
                {evento.tipo}
              </Text>

              <Text
                numberOfLines={2}
                style={{
                  fontSize: 10,
                  fontWeight: '700',
                  color: '#023411',
                }}
              >
                {evento.titulo}
              </Text>

              <Text
                numberOfLines={2}
                style={{
                  marginTop: 3,
                  fontSize: 10,
                  color: '#666',
                }}
              >
                {evento.subtitulo}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={14}
              color="#546B5F"
            />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
} 