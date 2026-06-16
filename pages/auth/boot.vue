<script setup lang="ts">
import { LoaderCircle } from 'lucide-vue-next';
import { useSessionAccess } from '~/composables/auth/useSessionAccess';

definePageMeta({
  layout: 'login',
});

useHead({
  title: 'Preparando sua sessao | Urban Mobi',
});

const route = useRoute();
const { role, waitForSessionData } = useSessionAccess();

const roleDashboardRedirect = {
  admin: '/admin',
  'master-manager': '/corporative',
  'branch-manager': '/corporative',
  'platform-admin': '/corporative',
  'platform-corp-user': '/personal',
  'platform-user': '/personal',
  'platform-driver': '/driver',
} as const;

const getSafeCallbackUrl = (value: unknown): string => {
  if (typeof value !== 'string' || !value.trim()) {
    return '/';
  }

  if (value.startsWith('/')) {
    return value;
  }

  try {
    const parsed = new URL(value);

    if (process.client && parsed.origin === window.location.origin) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}` || '/';
    }
  } catch {
    return '/';
  }

  return '/';
};

const getDashboardByRole = (currentRole: string | undefined): string => {
  if (!currentRole) return '/';
  return roleDashboardRedirect[currentRole as keyof typeof roleDashboardRedirect] || '/';
};

const isPathAllowedForRole = (path: string, currentRole: string | undefined): boolean => {
  if (!currentRole) return false;
  if (path === '/' || path.startsWith('/auth/')) return true;

  if (currentRole === 'admin') {
    return (
      path.startsWith('/admin') ||
      path.startsWith('/rides/') ||
      path.startsWith('/profile')
    );
  }

  if (currentRole === 'master-manager') {
    return (
      path.startsWith('/corporative') ||
      path.startsWith('/rides/') ||
      path.startsWith('/profile')
    );
  }

  if (currentRole === 'branch-manager' || currentRole === 'platform-admin') {
    if (path.startsWith('/corporative/contracts/edit')) return false;

    return (
      path.startsWith('/corporative') ||
      path.startsWith('/rides/') ||
      path.startsWith('/profile')
    );
  }

  if (currentRole === 'platform-user' || currentRole === 'platform-corp-user') {
    return path.startsWith('/personal') || path.startsWith('/profile');
  }

  if (currentRole === 'platform-driver') {
    return path.startsWith('/driver') || path.startsWith('/profile');
  }

  return false;
};

const resolveRoleSafeCallbackPath = (
  callbackPath: string,
  currentRole: string | undefined,
): string => {
  if (!currentRole) return '/';
  if (isPathAllowedForRole(callbackPath, currentRole)) return callbackPath;
  return getDashboardByRole(currentRole);
};

onMounted(async () => {
  const callbackPath = getSafeCallbackUrl(route.query.callbackUrl);
  const ready = await waitForSessionData({
    requireUserId: true,
    requireRole: true,
    timeoutMs: 15000,
  });

  if (!ready) {
    await navigateTo(
      {
        path: '/auth/login',
        query: { callbackUrl: callbackPath },
      },
      { replace: true },
    );
    return;
  }

  const safeRedirectPath = resolveRoleSafeCallbackPath(callbackPath, role.value);
  await navigateTo(safeRedirectPath, { replace: true });
});
</script>

<template>
  <main class="min-h-screen bg-black flex items-center justify-center p-6">
    <section class="flex flex-col items-center gap-5 text-center">
      <LoaderCircle class="my-4 w-12 h-12 text-emerald-400 animate-spin" />
      <h1 class="text-white text-sm uppercase">Validadon seu acesso</h1>
    </section>
  </main>
</template>
