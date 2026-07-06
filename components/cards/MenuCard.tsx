import { router } from 'expo-router';
import { Pressable, Text } from 'react-native';

type Props = {
  titulo: string;
  rota: string;
};

export default function MenuCard({
  titulo,
  rota,
}: Props) {
  return (
    <Pressable
      onPress={() => router.push(rota as any)}
      style={({ pressed }) => [
        {
          width: '48%',
          height: 58,
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
          fontSize: 12,
          fontWeight: '700',
          color: '#023411',
        }}
      >
        {titulo}
      </Text>
    </Pressable>
  );
}