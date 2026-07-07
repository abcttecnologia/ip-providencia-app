import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { getVersiculo } from '../../services/versiculo';

export default function VersiculoCard() {
  const [versiculo, setVersiculo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarVersiculo();
  }, []);

  async function carregarVersiculo() {
    try {
      const dados = await getVersiculo();
      setVersiculo(dados);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View
        style={{
          marginHorizontal: 16,
          marginBottom: 16,
          backgroundColor: '#FFF',
          borderRadius: 18,
          padding: 20,
          alignItems: 'center',
        }}
      >
        <ActivityIndicator color="#546B5F" />
      </View>
    );
  }

  if (!versiculo) return null;

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginBottom: 18,
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 20,

        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
      }}
    >
      <Text
        style={{
          color: '#546B5F',
          fontSize: 12,
          fontWeight: '700',
          marginBottom: 10,
        }}
      >
        {versiculo.titulo}
      </Text>

<Text
        style={{
          fontSize: 14,
          color: '#333',
          lineHeight: 26,
        }}
      >
        {""}
        {versiculo.texto}
        {""}
      </Text>

      <Text
        style={{
          marginTop: 12,
          fontWeight: '700',
          color: '#023411',
          fontSize: 14,
        }}
      >
        {versiculo.referencia}
        {versiculo.versao ? ` • ${versiculo.versao}` : ''}
      </Text>

      {versiculo.oracao ? (
        <>
          <View
            style={{
              height: 1,
              backgroundColor: '#EAEAEA',
              marginVertical: 18,
            }}
          />

          <Text
            style={{
              color: '#546B5F',
              fontWeight: '700',
              marginBottom: 8,
            }}
          >
            🙏 Oração
          </Text>

          <Text
            style={{
              color: '#666',
              lineHeight: 24,
              fontSize: 14,
            }}
          >
            {versiculo.oracao}
          </Text>
        </>
      ) : null}
    </View>
  );
}