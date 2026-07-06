import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { getAvisos } from '../services/avisos';

export default function AvisosScreen() {
  const [avisos, setAvisos] = useState<any[]>([]);

  useEffect(() => {
    carregarAvisos();
  }, []);

  async function carregarAvisos() {
    try {
      const dados = await getAvisos();

      dados.sort((a: any, b: any) => {
        if (a.importante === b.importante) return 0;
        return a.importante ? -1 : 1;
      });

      setAvisos(dados);
    } catch (error) {
      console.log(error);
    }
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
        {/* Cabeçalho */}
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
            Avisos
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
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

          {avisos.map((aviso) => (
            <View
              key={aviso.id}
              style={{
                backgroundColor: '#FFF',
                borderRadius: 22,
                padding: 20,
                marginBottom: 16,

                borderLeftWidth: aviso.importante ? 6 : 0,
                borderLeftColor: '#2E7D32',

                shadowColor: '#000',
                shadowOffset: {
                  width: 0,
                  height: 2,
                },
                shadowOpacity: 0.06,
                shadowRadius: 6,
                elevation: 3,
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
            </View>
          ))}
        </ScrollView>
      </View>
    </>
  );
}