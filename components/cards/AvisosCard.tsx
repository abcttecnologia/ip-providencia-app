import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

type Props = {
  avisos: any[];
};

export default function AvisosCard({ avisos }: Props) {
  if (!avisos.length) return null;

  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 20,

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
      {/* Cabeçalho */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Feather
            name="bell"
            size={16}
            color="#759A7D"
          />

          <Text
            style={{
              marginLeft: 8,
              fontSize: 10,
              fontWeight: '700',
              color: '#546B5F',
            }}
          >
            ÚLTIMOS AVISOS
          </Text>
        </View>

        <Pressable
          onPress={() => router.push('/avisos')}
        >
          <Text
            style={{
              fontSize: 11,
              color: '#023411',
              fontWeight: '700',
            }}
          >
            Ver todos ›
          </Text>
        </Pressable>
      </View>

      {avisos.slice(0, 3).map((aviso, index) => (
        <Pressable
          key={aviso.id}
          onPress={() => router.push('/avisos')}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 4,
                marginTop: 5,
                marginRight: 6,
                backgroundColor: aviso.importante
                  ? '#E4B400'
                  : '#5FAF4E',
              }}
            />

            <View style={{ flex: 1 }}>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 10,
                  fontWeight: '700',
                  color: '#023411',
                }}
              >
                {aviso.titulo}
              </Text>

              <Text
                numberOfLines={1}
                style={{
                  marginTop: 2,
                  fontSize: 10,
                  color: '#666',
                }}
              >
                {aviso.descricao}
              </Text>
            </View>

            <Text
              style={{
                fontSize: 10,
                color: '#999',
                marginLeft: 8,
              }}
            >
              {aviso.data}
            </Text>
          </View>

          {index < 2 && (
            <View
              style={{
                height: 1,
                backgroundColor: '#EFEFEF',
                marginVertical: 12,
              }}
            />
          )}
        </Pressable>
      ))}
    </View>
  );
}