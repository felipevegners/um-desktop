import { getServerSession } from '#auth';
import { type H3Event, createError } from 'h3';

export function resolveUmApiBaseUrl(): string {
  return (
    process.env.UM_API_BASE_URL ||
    process.env.EXPO_PUBLIC_UM_API_URL ||
    'https://um-api-pu0t.onrender.com'
  );
}

export async function resolveUmApiToken(event: H3Event): Promise<string> {
  try {
    const session = await getServerSession(event as any);
    const token = (session?.user as any)?.umApiToken as string | undefined;
    if (token) return token;
  } catch {
    // sessão não disponível, cai no erro abaixo
  }

  throw createError({
    statusCode: 401,
    statusMessage: 'Sessão expirada. Faça login novamente.',
  });
}

export async function buildUmApiAuthHeaders(
  event: H3Event,
): Promise<Record<string, string>> {
  const token = await resolveUmApiToken(event);
  return {
    Authorization: `Bearer ${token}`,
  };
}
