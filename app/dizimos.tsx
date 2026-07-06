import * as Clipboard from 'expo-clipboard';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';

export default function DizimosScreen() {
  const chavePix = 'ipnoroeste@ipn.org.br';

  async function copiarPix() {
    await Clipboard.setStringAsync(chavePix);
    Alert.alert('Pix copiado!', 'A chave Pix foi copiada.');
  }

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: '#ECE8DD',
      }}
    >
      <View
        style={{
          alignItems: 'center',
          paddingTop: 70,
          paddingHorizontal: 20,
        }}
      >
        <Image
          source={require('../assets/images/1.png')}
          style={{
            width: 90,
            height: 90,
            resizeMode: 'contain',
          }}
        />

        <Text
          style={{
            textAlign: 'center',
            fontSize: 28,
            fontWeight: '700',
            color: '#0F4A0F',
            marginTop: 10,
          }}
        >
          Dízimos
        </Text>

        <Text
          style={{
            textAlign: 'center',
            color: '#666',
            marginTop: 10,
            lineHeight: 22,
          }}
        >
          Cada um contribua segundo tiver proposto no coração,
          não com tristeza ou por necessidade;
          porque Deus ama a quem dá com alegria.
        </Text>

        <Text
          style={{
            marginTop: 8,
            fontWeight: '700',
            color: '#0F4A0F',
          }}
        >
          2 Coríntios 9:7
        </Text>

        <View
          style={{
            width: '100%',
            backgroundColor: '#FFFFFF',
            marginTop: 30,
            borderRadius: 16,
            padding: 20,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: '900',
              color: '#0F4A0F',
            }}
          >
            Chave Pix
          </Text>

          <Text
            style={{
              marginTop: 12,
              fontSize: 16,
              color: '#333',
            }}
          >
            {chavePix}
          </Text>

          <Pressable
            onPress={copiarPix}
            style={{
              backgroundColor: '#0F4A0F',
              padding: 14,
              borderRadius: 12,
              marginTop: 30,
            }}
          >
            <Text
              style={{
                color: '#FFF',
                textAlign: 'center',
                fontWeight: '700',
              }}
            >
              Copiar Chave Pix
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}