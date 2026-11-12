import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCurrentUserProfile } from '../../hooks/useCurrentUserProfile';

export default function Header() {
  const insets = useSafeAreaInsets();
  const { user } = useCurrentUserProfile();
  const firstName = user?.nome?.trim().split(/\s+/)[0];

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: insets.top + 12,
        paddingBottom: 18,
        paddingHorizontal: 20,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#546B5F', fontSize: 13 }}>
          Que bom ter você aqui
        </Text>
        <Text
          numberOfLines={1}
          style={{
            color: '#023411',
            fontSize: 22,
            fontWeight: '800',
            marginTop: 2,
          }}
        >
          Olá{firstName ? `, ${firstName}` : ''}!
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Abrir avisos"
        onPress={() => router.push('/avisos')}
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="notifications-outline" size={22} color="#023411" />
      </Pressable>
    </View>
  );
}