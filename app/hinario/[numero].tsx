import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { hinos } from '../../services/hinos';

export default function HinoScreen() {
  const { numero } = useLocalSearchParams();

  const hino = hinos.find(
    h => h.numero === Number(numero)
  );

  if (!hino) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text>Hino não encontrado.</Text>
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
              size={20}
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
            Hino {hino.numero}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={{
            padding: 20,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: '700',
              color: '#023411',
              marginBottom: 20,
            }}
          >
            {hino.titulo}
          </Text>

          <Text
            style={{
              fontSize: 18,
              lineHeight: 32,
              color: '#333',
            }}
          >
            {hino.letra}
          </Text>
        </ScrollView>
      </View>
    </>
  );
}