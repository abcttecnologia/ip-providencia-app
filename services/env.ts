export function requireEnv(name: string, value: string | undefined): string {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    throw new Error(`A variável de ambiente ${name} não está configurada.`);
  }

  return normalizedValue;
}
