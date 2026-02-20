import { getServerSession } from '#auth';
import { createError, defineEventHandler, getCookie, getHeader, getRequestURL } from 'h3';
import jwt from 'jsonwebtoken';

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event);
  const pathname = url.pathname || '';

  // Only enforce auth for API routes. Allow root, auth endpoints, assets and OPTIONS.
  if (!pathname.startsWith('/api/')) {
    return;
  }

  if (
    pathname === '/' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_nuxt') ||
    pathname.startsWith('/api/public') ||
    (event.node.req && (event.node.req as any).method === 'OPTIONS')
  ) {
    return;
  }

  const authHeader = getHeader(event, 'authorization') || '';
  const cookieToken = getCookie(event, 'access_token') as string | undefined;
  const nextAuthToken = (getCookie(event, 'next-auth.session-token') ||
    getCookie(event, '__Secure-next-auth.session-token')) as string | undefined;

  const token =
    authHeader && authHeader.toString().startsWith('Bearer ')
      ? authHeader.toString().slice(7)
      : cookieToken || nextAuthToken;

  // First try NextAuth server-side session (works with @sidebase/nuxt-auth)
  try {
    const session = await getServerSession(event as any);
    if (session && session.user) {
      (event as any).context = (event as any).context || {};
      (event as any).context.user = session.user;
      return;
    }
  } catch (e) {
    // ignore and fallback to JWT verification
  }

  if (!token) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET as string);
    (event as any).context = (event as any).context || {};
    (event as any).context.user = payload;
  } catch (err) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }
});
