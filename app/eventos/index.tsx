import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import {
    router,
    Stack,
    useLocalSearchParams,
} from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Linking,
    Pressable,
    ScrollView,
    Text,
    View,
} from 'react-native';

import { getEvento } from '../../services/eventos';

export default function EventoScreen() {
  const { id } = useLocalSearchParams();

  const [evento, setEvento] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarEvento();
  }, []);

  async function carregarEvento() {
    try {
      const dados = await getEvento(id as string);
      setEvento(dados);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  async function copiarPix() {
    if (!evento?.pix) return;

    await Clipboard.setStringAsync(evento.pix);

    alert('PIX copiado com sucesso!');
  }

  function abrirLink() {
    if (!evento?.link) return;

    Linking.openURL(evento.link);
  }

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />

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

      <ScrollView
        style={{
          flex: 1,
          backgroundColor: '#ECE8DD',
        }}
        contentContainerStyle={{
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabeçalho */}
        <View
          style={{
            backgroundColor: '#023411',
            paddingTop: 55,
            paddingBottom: 18,
            paddingHorizontal: 18,
            flexDirection: 'row',
            alignItems: 'center',
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
              fontSize: 16,
              fontWeight: '700',
              marginRight: 24,
            }}
          >
            {evento.titulo}
          </Text>
        </View>

        <Image
        source={{ uri: evento.imagem }}
        style={{
            width: '100%',
            height: 180,
        }}
        resizeMode="cover"
        />

        <View
          style={{
            padding: 22,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: '800',
              color: '#023411',
            }}
          >
            {evento.titulo}
          </Text>

          <Text
            style={{
              marginTop: 4,
              fontSize: 12,
              color: '#666',
            }}
          >
            {evento.subtitulo}
          </Text>
        {evento.valorarrecadado && (
          <View
            style={{
              marginTop: 28,
              marginBottom: 28,
            backgroundColor: '#FFF',
              borderRadius: 20,
              padding: 22,
              elevation: 3,
              shadowColor: '#211f1f',
              shadowOpacity: 0.05,
              shadowRadius: 24,
              shadowOffset: {
                width: 0,
                height: 2,
              },
            }}
          >
            <Text
              style={{
                textAlign: 'center',
                fontSize: 18,
                color: '#777',
              }}
            >
              Valor arrecadado
            </Text>

            <Text
              style={{
                marginTop: 8,
                textAlign: 'center',
                fontSize: 20,
                fontWeight: '800',
                color: '#546B5F',
              }}
            >
              {Number(
                evento.valorarrecadado
              ).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </Text>
          </View>
        )}

        <Pressable
          onPress={abrirLink}
          style={{
            height: 46,
            backgroundColor: '#FFF',
            borderRadius: 14,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: '#023411',
              fontSize: 12,
              fontWeight: '700',
            }}
          >
            Ver mais informações
          </Text>
        </Pressable>

        {evento.pix && (
          <Pressable
            onPress={copiarPix}
            style={{
              marginTop: 14,
              height: 52,
              backgroundColor: '#023411',
              borderRadius: 14,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: '#D5DED6',
                fontSize: 16,
                fontWeight: '700',
              }}
            >
              Copiar PIX
            </Text>
          </Pressable>
        )}
          </View>
      </ScrollView>
    </>
  );
}      