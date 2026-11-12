import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export default function BoletimCard() {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push('/(tabs)/boletim')}
      style={{
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 18,
        borderRadius: 18,
        backgroundColor: '#1A3F12',
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text
          style={{
            color: '#D5DED6',
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 0.6,
          }}
        >
          BOLETIM DA SEMANA
        </Text>
        <Text
          style={{
            color: '#FFFFFF',
            fontSize: 17,
            fontWeight: '800',
            marginTop: 5,
          }}
        >
          Devocional e novidades
        </Text>
        <Text style={{ color: '#E4EADF', fontSize: 12, marginTop: 4 }}>
          Toque para abrir o boletim completo
        </Text>
      </View>
      <Ionicons name="document-text-outline" size={28} color="#FFFFFF" />
    </Pressable>
  );
}
