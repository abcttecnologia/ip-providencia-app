import { Image, Text, View } from 'react-native';

export default function Header() {
  return (
    <View
      style={{
        alignItems: 'center',
        paddingTop: 90,
        paddingBottom: 20,
        paddingHorizontal: 20,
      }}
    >
<Image
  source={require('../../assets/images/1.png')}
  style={{
    width: 55,
    height: 55,
    borderRadius: 10,
    marginBottom: 8,
  }}
/>

      <Text
        style={{
          fontSize: 18,
          fontWeight: '700',
          color: '#023411',
        }}
      >
        IP Providência
      </Text>

      <Text
        style={{
          fontSize: 11,
          color: '#7A7A7A',
          marginTop: 4,
          textAlign: 'center',
        }}
      >
        Deus guia. Deus sustenta. Deus provê.
      </Text>
    </View>
  );
}