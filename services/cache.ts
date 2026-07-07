import AsyncStorage from "@react-native-async-storage/async-storage";

export async function salvarCache(chave: string, dados: any) {
  try {
    await AsyncStorage.setItem(chave, JSON.stringify(dados));
  } catch (e) {
    console.log("Erro ao salvar cache:", e);
  }
}

export async function lerCache<T = any>(chave: string): Promise<T | null> {
  try {
    const valor = await AsyncStorage.getItem(chave);

    if (!valor) return null;

    return JSON.parse(valor);
  } catch (e) {
    console.log("Erro ao ler cache:", e);
    return null;
  }
}

export async function removerCache(chave: string) {
  try {
    await AsyncStorage.removeItem(chave);
  } catch (e) {
    console.log("Erro ao remover cache:", e);
  }
}

export async function limparCache() {
  try {
    await AsyncStorage.clear();
  } catch (e) {
    console.log("Erro ao limpar cache:", e);
  }
}