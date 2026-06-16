import { getServerSession } from '#auth';
import { defineEventHandler } from 'h3';
import { $fetch } from 'ofetch';

import { resolveUmApiBaseUrl } from '../../utils/um-api';

async function verifyUmApiSession(
  apiBaseUrl: string,
  token: string,
): Promise<{
  ok: boolean;
  reason?: 'unauthorized' | 'upstream_unavailable';
  statusCode?: number;
}> {
  const meUrl = new URL('/auth/me', apiBaseUrl);

  try {
    await $fetch(meUrl.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return { ok: true };
  } catch (error: any) {
    const statusCode = error?.statusCode || error?.response?.status || 500;

    if (statusCode === 401) {
      return {
        ok: false,
        reason: 'unauthorized',
        statusCode,
      };
    }

    return {
      ok: false,
      reason: 'upstream_unavailable',
      statusCode,
    };
  }
}

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event as any);
  const user = (session?.user as any) ?? null;
  const token = typeof user?.umApiToken === 'string' ? user.umApiToken : '';

  if (!user?.id || !user?.role || !token || user?.authError) {
    return {
      ready: false,
      reason: 'session_not_ready',
    };
  }

  const apiBaseUrl = resolveUmApiBaseUrl();
  let lastResult: Awaited<ReturnType<typeof verifyUmApiSession>> | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const verification = await verifyUmApiSession(apiBaseUrl, token);

    if (verification.ok) {
      return {
        ready: true,
        user: {
          id: user.id,
          role: user.role,
        },
      };
    }

    lastResult = verification;

    if (verification.reason === 'upstream_unavailable') {
      break;
    }
  }

  if (lastResult?.reason === 'upstream_unavailable') {
    return {
      ready: false,
      reason: 'auth_upstream_unavailable',
      statusCode: lastResult.statusCode,
    };
  }

  return {
    ready: false,
    reason: 'um_api_token_not_ready',
  };
});
