import { router } from 'expo-router';
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

export default function HomeScreen() {
  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: '#ECE8DD',
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* CABEÇALHO */}
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 80,
          paddingBottom: 20,
          paddingHorizontal: 20,
        }}
      >
        <Image
          source={require('../../assets/images/1.png')}
          style={{
            width: 60,
            height: 60,
            resizeMode: 'contain',
            marginBottom: 8,
          }}
        />

        <Text
          style={{
            fontSize: 16,
            fontWeight: '700',
            color: '#0F4A0F',
            textAlign: 'center',
          }}
        >
          IP Providência
        </Text>

        <Text
          style={{
            fontSize: 10,
            color: '#7A7A7A',
            textAlign: 'center',
            marginTop: 3,
          }}
        >
          Deus guia. Deus sustenta. Deus provê.
        </Text>
      </View>

      {/* PALAVRA DA SEMANA */}
      <View
        style={{
          backgroundColor: '#0F4A0F',
          marginHorizontal: 16,
          borderRadius: 14,
          padding: 12,
          marginBottom: 12,
        }}
      >
        <Text
          style={{
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: '700',
            marginBottom: 8,
          }}
        >
          Palavra da Semana
        </Text>

        <Text
          style={{
            color: '#FFFFFF',
            fontSize: 12,
            lineHeight: 18,
          }}
        >
          Porque até aqui nos ajudou o Senhor.
        </Text>

        <Text
          style={{
            color: '#E4EB9E',
            fontSize: 12,
            fontWeight: '700',
            marginTop: 8,
          }}
        >
          1 Samuel 7:12
        </Text>
      </View>

      {/* MENU */}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingBottom: 25,
        }}
      >
        <MenuCard titulo="Boletim" rota="/boletim" />
        <MenuCard titulo="Sermões" rota="/sermoes" />
        <MenuCard titulo="Obra" rota="/obra" />
        <MenuCard titulo="Agenda" rota="/mais" />
        <MenuCard titulo="Oração" rota="/mais" />
        <MenuCard titulo="Mais" rota="/mais" />
      </View>
    </ScrollView>
  );
}

function MenuCard({
  titulo,
  rota,
}: {
  titulo: string;
  rota: string;
}) {
  return (
    <Pressable
      onPress={() => router.push(rota as any)}
      style={({ pressed }) => [
        {
          width: '48%',
          height: 70,
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          marginBottom: 12,
          justifyContent: 'center',
          alignItems: 'center',

          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 1,
          },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 2,

          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: '700',
          color: '#0F4A0F',
        }}
      >
        {titulo}
      </Text>
    </Pressable>
  );
}