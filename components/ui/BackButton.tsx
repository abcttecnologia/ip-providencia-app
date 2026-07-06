import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text } from 'react-native';

export default function BackButton() {
  return (
    <Pressable
      onPress={() => router.back()}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 60,
        marginBottom: 24,
      }}
    >
      <Ionicons
        name="arrow-back"
        size={24}
        color="#023411"
      />

      <Text
        style={{
          marginLeft: 8,
          fontSize: 20,
          fontWeight: '700',
          color: '#023411',
        }}
      >
        Voltar
      </Text>
    </Pressable>
  );
}