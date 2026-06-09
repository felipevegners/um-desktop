import { getServerSession } from '#auth';
import {
  createError,
  defineEventHandler,
  getQuery,
  getRequestURL,
} from 'h3';

function isPublicApiPath(pathname: string): boolean {
  if (pathname.startsWith('/api/auth')) return true;
  if (pathname.startsWith('/api/public')) return true;
  if (pathname.startsWith('/api/uploadthing')) return true;
  if (pathname.startsWith('/api/files')) return true;
  if (pathname.startsWith('/api/products')) return true;
  if (pathname.startsWith('/api/travels/routes')) return true;

  return false;
}

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event);
  const pathname = url.pathname || '';
  const method = event.node.req?.method || 'GET';
  const query = getQuery(event) as Record<string, string | string[] | undefined>;
  const publicTrack = String(query.publicTrack || '') === '1';
  const hasId = typeof query.id === 'string' && query.id.length > 0;
  const isPublicTrackApiRequest =
    method === 'GET' &&
    publicTrack &&
    hasId &&
    (pathname === '/api/rides' || pathname === '/api/drivers');

  if (pathname.includes('/api/files')) {
    console.debug('[Auth Middleware] Files route detected, skipping auth');
  }

  // Only enforce auth for API routes. Allow root, auth endpoints, assets and OPTIONS.
  if (!pathname.startsWith('/api/')) {
    return;
  }

  if (isPublicTrackApiRequest) {
    return;
  }

  if (
    pathname === '/' ||
    pathname.startsWith('/_nuxt') ||
    isPublicApiPath(pathname) ||
    (event.node.req && (event.node.req as any).method === 'OPTIONS')
  ) {
    return;
  }

  try {
    const session = await getServerSession(event as any);
    if (session && session.user) {
      (event as any).context = (event as any).context || {};
      (event as any).context.user = session.user;
      return;
    }
  } catch {
    // Fallthrough to standardized 401 below.
  }

  throw createError({
    statusCode: 401,
    statusMessage: 'Sessão inválida ou expirada. Faça login novamente.',
  });
});
