import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

type Props = {
  visible: boolean;
};

export default function OfflineBanner({ visible }: Props) {
  if (!visible) return null;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF7E6',
        borderColor: '#F59E0B',
        borderWidth: 1,
        borderRadius: 14,
        marginHorizontal: 20,
        marginTop: 12,
        marginBottom: 12,
        paddingVertical: 10,
        paddingHorizontal: 14,
      }}
    >
      <Ionicons
        name="cloud-offline-outline"
        size={18}
        color="#8A5A00"
      />

      <Text
        style={{
          flex: 1,
          marginLeft: 8,
          color: '#8A5A00',
          fontSize: 13,
          fontWeight: '600',
        }}
      >
        Você está visualizando conteúdo salvo offline.
      </Text>
    </View>
  );
}