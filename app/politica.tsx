import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';

const PRIVACY_URL =
  'https://igrejapresbiterianaprovidencia-arch.github.io/boletins-igreja/privacy.html';

export default function PoliticaScreen() {
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
              size={20}
              color="#FFF"
            />
          </Pressable>

          <Text
            style={{
              flex: 1,
              textAlign: 'center',
              color: '#FFF',
              fontSize: 14,
              fontWeight: '700',
              marginRight: 24,
            }}
          >
            Política de Privacidade
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={{
            padding: 20,
            paddingBottom: 40,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#023411', marginBottom: 12 }}>
            Resumo
          </Text>
          <Text style={{ fontSize: 12, lineHeight: 22, color: '#444', marginBottom: 24 }}>
            Coletamos e utilizamos apenas dados necessários para cadastro, acesso,
            comunicação pastoral e funcionamento dos recursos da igreja. Não vendemos
            dados pessoais. Notificações e integrações podem receber informações
            estritamente relacionadas ao uso solicitado.
          </Text>
          <Pressable
            accessibilityRole="link"
            onPress={() => void Linking.openURL(PRIVACY_URL)}
            style={{
              backgroundColor: '#023411',
              borderRadius: 8,
              alignItems: 'center',
              paddingVertical: 14,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>
              Ler a política completa
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </>
  );
}