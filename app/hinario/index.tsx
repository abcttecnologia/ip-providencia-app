import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import {
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from 'react-native';

import { hinos } from '../../services/hinos';

export default function HinarioScreen() {
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
              fontWeight: '700',
              marginRight: 24,
            }}
          >
            Hinário Novo Cântico
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: 18,
          }}
        >
          <Text
            style={{
              color: '#546B5F',
              fontSize: 14,
              textAlign: 'center',
              marginBottom: 18,
            }}
          >
            Pesquise por número ou título do hino.
          </Text>

          <View
            style={{
              backgroundColor: '#FFF',
              borderRadius: 14,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 14,
              marginBottom: 20,
              height: 48,
            }}
          >
            <Ionicons
              name="search-outline"
              size={20}
              color="#546B5F"
            />

            <TextInput
              placeholder="Pesquisar..."
              style={{
                flex: 1,
                marginLeft: 10,
                fontSize: 15,
              }}
            />
          </View>

          {hinos.map((hino) => (
           <Pressable
            key={hino.numero}
            onPress={() =>
                router.push(`/hinario/${hino.numero}`)
            }
            style={{
                backgroundColor: '#FFF',
                borderRadius: 18,
                padding: 16,
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: '#DCE8DE',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: '#023411',
                    fontWeight: '700',
                  }}
                >
                  {hino.numero}
                </Text>
              </View>

              <View
                style={{
                  flex: 1,
                  marginLeft: 14,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: '#023411',
                  }}
                >
                  {hino.titulo}
                </Text>

                <Text
                  style={{
                    color: '#777',
                    marginTop: 2,
                  }}
                >
                  {hino.categoria}
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color="#546B5F"
              />
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </>
  );
}