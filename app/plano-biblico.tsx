import { Text, View } from 'react-native';

import AppHeader from '../components/ui/AppHeader';
import Screen from '../components/ui/Screen';

export default function PlanoBiblicoScreen() {
  return (
    <Screen>
      <AppHeader title="Plano Bíblico" />
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <Text
          style={{
            color: '#546B5F',
            fontSize: 18,
            fontWeight: '600',
          }}
        >
          Em breve
        </Text>
      </View>
    </Screen>
  );
}
