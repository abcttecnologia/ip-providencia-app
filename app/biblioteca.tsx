import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { getBiblioteca } from '../services/biblioteca';

export default function BibliotecaScreen() {
  const [materiais, setMateriais] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    try {
      const dados = await getBiblioteca();
      setMateriais(dados.filter((item: any) => item.ativo));
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
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
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View
        style={{
          flex: 1,
          backgroundColor: '#ECE8DD',
        }}
      >
        {/* CABEÇALHO */}
        <View
          style={{
            backgroundColor: '#023411',
            height: 105,
            paddingTop: 50,
            paddingHorizontal: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              position: 'absolute',
              left: 20,
              top: 65,
            }}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color="#FFFFFF"
            />
          </Pressable>

          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 20,
              fontWeight: '700',
            }}
          >
            Biblioteca
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={{
            padding: 20,
            paddingBottom: 40,
          }}
        >
          {materiais.map((item: any) => (
            <Pressable
              key={item.id}
              onPress={() => Linking.openURL(item.url)}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 24,
                padding: 18,
                marginBottom: 16,

                flexDirection: 'row',
                alignItems: 'center',

                shadowColor: '#000',
                shadowOpacity: 0.06,
                shadowRadius: 6,
                shadowOffset: {
                  width: 0,
                  height: 2,
                },
                elevation: 2,
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
                    fontSize: 14,
                    fontWeight: '700',
                    color: '#023411',
                  }}
                >
                  {item.titulo}
                </Text>

                <Text
                  style={{
                    fontSize: 12,
                    color: '#777',
                    marginTop: 4,
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
          ))}
        </ScrollView>
      </View>
    </>
  );
}