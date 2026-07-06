import { router } from 'expo-router';
import { Pressable, Text } from 'react-native';

type Props = {
  evento: any;
  formatarDataEvento: (evento: any) => string;
};

export default function EventoCard({
  evento,
  formatarDataEvento,
}: Props) {
  if (!evento) return null;

  return (
    <Pressable
      onPress={() => router.push('/agenda' as any)}
      style={{
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,

        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: '700',
          color: '#7A6E4F',
          marginBottom: 4,
        }}
      >
        PRÓXIMO EVENTO
      </Text>

      <Text
        style={{
          fontSize: 13,
          fontWeight: '700',
          color: '#023411',
        }}
      >
        {formatarDataEvento(evento)}
      </Text>

      <Text
        numberOfLines={2}
        style={{
          marginTop: 2,
          fontSize: 12,
          color: '#444',
        }}
      >
        {evento.summary}
      </Text>
    </Pressable>
  );
}