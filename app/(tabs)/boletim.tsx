import { SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';

export default function BoletimScreen() {
  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: '#ECE8DD',
        paddingTop: 25,
      }}
    >
      <WebView
        source={{
          uri: 'https://boletimipprovidencia.netlify.app/',
        }}
        style={{
          flex: 1,
        }}
      />
    </SafeAreaView>
  );
}