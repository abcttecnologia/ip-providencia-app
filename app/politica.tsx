import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

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
          <Text
            style={{
              fontSize: 16,
              fontWeight: '700',
              color: '#023411',
              marginBottom: 16,
            }}
          >
            Igreja Presbiteriana Providência
          </Text>

          <Text
            style={{
              fontSize: 12,
              lineHeight: 24,
              color: '#444',
            }}
          >
            Este aplicativo foi desenvolvido para auxiliar os membros e visitantes
            da Igreja Presbiteriana Providência.

            {'\n\n'}

            O aplicativo não comercializa informações pessoais e utiliza apenas
            os dados estritamente necessários para o funcionamento de seus recursos.

            {'\n\n'}

            Algumas funcionalidades podem direcionar o usuário para serviços de
            terceiros, como YouTube, Instagram, Google Maps e WhatsApp. Cada um
            desses serviços possui sua própria Política de Privacidade.

            {'\n\n'}

            O aplicativo poderá utilizar notificações para comunicar avisos,
            eventos e informações da igreja.

            {'\n\n'}

            Nenhum dado pessoal é vendido ou compartilhado para fins comerciais.

            {'\n\n'}

            Em caso de dúvidas, entre em contato:

            {'\n\n'}

            igrejapresbiterianaprovidencia@gmail.com

            {'\n\n'}

            Desenvolvido por:

            Adriana Rosena

            abcttecnologia@gmail.com

            {'\n\n'}

            Última atualização: Julho de 2026.
          </Text>
        </ScrollView>
      </View>
    </>
  );
}