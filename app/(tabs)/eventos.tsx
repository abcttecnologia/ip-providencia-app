import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { getEventos } from '../../services/eventos';
import { deleteEvento } from '../../services/eventos';
import { useCurrentUserProfile } from '../../hooks/useCurrentUserProfile';

export default function EventosScreen() {
  const { user } = useCurrentUserProfile();
  const [eventos, setEventos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const canManage =
    user?.ativo === true &&
    (user.perfil === 'ADMINISTRADOR' ||
      user.funcoes?.includes('SECRETARIA'));

 async function carregarEventos() {
  try {
    const dados = await getEventos();

    console.log(dados);

    setEventos(
      dados.filter((item: any) => item.ativo)
    );
  } catch (error) {
    console.log(error);
  } finally {
    setLoading(false);
  }
 }

 useEffect(() => {
   const timer = setTimeout(() => void carregarEventos(), 0);
   return () => clearTimeout(timer);
 }, []);

 function confirmDelete(evento: any) {
    Alert.alert(
      'Excluir evento?',
      'Essa ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => void removeEvento(evento),
        },
      ],
    );
   }

   async function removeEvento(evento: any) {
    try {
      await deleteEvento(evento.id);
      setEventos((current) => current.filter((item) => item.id !== evento.id));
      Alert.alert('Excluído', 'O evento foi excluído.');
    } catch (deleteError) {
      console.error('Falha ao excluir evento:', deleteError);
      Alert.alert(
        'Não foi possível excluir',
        deleteError instanceof Error
          ? deleteError.message
          : 'Tente novamente em alguns instantes.',
      );
    }
}
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#ECE8DD',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator
          size="large"
          color="#023411"
        />
      </View>
    );
  }

  if (eventos.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#ECE8DD',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 30,
        }}
      >
        <Ionicons
          name="calendar-outline"
          size={60}
          color="#546B5F"
        />

        <Text
          style={{
            marginTop: 20,
            fontSize: 18,
            color: '#546B5F',
            fontWeight: '600',
            textAlign: 'center',
          }}
        >
          Nenhum evento disponível.
        </Text>

        <Text
          style={{
            marginTop: 8,
            fontSize: 14,
            color: '#666',
            textAlign: 'center',
            lineHeight: 22,
          }}
        >
          Em breve teremos novas campanhas e programações da igreja.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#ECE8DD',
      }}
    >
      <ScrollView
        style={{
          flex: 1,
        }}
        contentContainerStyle={{
          paddingBottom: 30,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            backgroundColor: '#023411',
            paddingTop: 55,
            paddingBottom: 16,
            paddingHorizontal: 18,
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 18,
          }}
        >
          <Pressable onPress={() => router.back()}>
            <Ionicons
              name="arrow-back"
              size={24}
              color="#FFF"
            />
          </Pressable>

          <Text
            style={{
              flex: 1,
              textAlign: 'center',
              color: '#FFF',
              fontSize: 20,
              fontWeight: '800',
              marginRight: 24,
            }}
          >
            Eventos
          </Text>
        </View>

        <Text
          style={{
            fontSize: 14,
            color: '#546B5F',
            textAlign: 'center',
            marginBottom: 22,
            paddingHorizontal: 28,
            lineHeight: 20,
          }}
        >
          Acompanhe os eventos, campanhas e programações especiais da Igreja.
        </Text>
               {eventos.map((evento) => (
          <View key={evento.id} style={{ marginHorizontal: 16, marginBottom: 16 }}>
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/eventos',
                params: {
                  id: evento.id,
                },
              })
            }
            style={{
              backgroundColor: '#FFF',
              borderRadius: 22,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',

              shadowColor: '#000',
              shadowOpacity: 0.06,
              shadowRadius: 6,
              shadowOffset: {
                width: 0,
                height: 2,
              },
              elevation: 3,
            }}
          >
<Image
  source={{ uri: evento.imagem }}
  style={{
    width: 90,
    height: 70,
    borderRadius: 12,
  }}
  resizeMode="cover"
/>

            <View
              style={{
                flex: 1,
                marginLeft: 14,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  color: '#546B5F',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  marginBottom: 4,
                }}
              >
                {evento.tipo}
              </Text>

              <Text
                numberOfLines={2}
                style={{
                  fontSize: 10,
                  fontWeight: '700',
                  color: '#023411',
                }}
              >
                {evento.titulo}
              </Text>

              <Text
                numberOfLines={2}
                style={{
                  marginTop: 3,
                  fontSize: 10,
                  color: '#666',
                }}
              >
                {evento.subtitulo}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={14}
              color="#546B5F"
            />
          </Pressable>
          {canManage ? (
            <Pressable
              onPress={() => confirmDelete(evento)}
              accessibilityRole="button"
              accessibilityLabel={`Excluir evento ${evento.titulo}`}
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                alignItems: 'center',
                paddingVertical: 8,
              }}
            >
              <Ionicons name="trash-outline" size={18} color="#B3261E" />
              <Text style={{ color: '#B3261E', marginLeft: 6, fontWeight: '700' }}>
                Excluir
              </Text>
            </Pressable>
          ) : null}
          </View>
        ))}
      </ScrollView>
    </View>
  );
} 