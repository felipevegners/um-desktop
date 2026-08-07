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
const { signOut } = useAuth();
const { role, status, waitForSessionData } = useSessionAccess();
const bootstrapStatusText = ref('Validando seu acesso');
const isBranchAccessBlocked = ref(false);
const isSigningOutBlockedUser = ref(false);

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
  if (path === '/') return true;

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
  if (callbackPath.startsWith('/auth/')) return getDashboardByRole(currentRole);
  if (isPathAllowedForRole(callbackPath, currentRole)) return callbackPath;
  return getDashboardByRole(currentRole);
};

type BranchAccessResponse = {
  blocked?: boolean;
};

const fetchBranchAccessState = async (): Promise<BranchAccessResponse> => {
  return await $fetch<BranchAccessResponse>('/api/auth/branch-access', {
    method: 'GET',
  });
};

const handleBlockedAccessSignOut = async () => {
  if (isSigningOutBlockedUser.value) {
    return;
  }

  isSigningOutBlockedUser.value = true;
  await signOut();
};

onMounted(async () => {
  const callbackPath = getSafeCallbackUrl(route.query.callbackUrl);

  if (status.value === 'unauthenticated') {
    await navigateTo(
      {
        path: '/auth/login',
        query: { callbackUrl: callbackPath },
      },
      { replace: true },
    );
    return;
  }

  bootstrapStatusText.value = 'Validando sua sessão';

  // Wait for identity fields before role-safe redirect and branch checks.
  const ready = await waitForSessionData({
    requireUserId: true,
    requireRole: true,
    timeoutMs: 20000,
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

  const branchAccessState = await fetchBranchAccessState().catch(() => ({
    blocked: false,
  }));

  if (branchAccessState?.blocked) {
    isBranchAccessBlocked.value = true;
    return;
  }

  await navigateTo(safeRedirectPath, { replace: true });
});
</script>

<template>
  <main class="min-h-screen bg-black flex items-center justify-center p-6">
    <section
      v-if="isBranchAccessBlocked"
      class="w-full max-w-lg rounded-xl border border-zinc-700 bg-zinc-950 p-8 text-white"
    >
      <h1 class="text-2xl font-bold">Acesso Inativo</h1>
      <p class="mt-4 text-sm text-zinc-200 leading-6">
        A filial ao qual você está vinculado foi desativada. Contate o Gestor Master para
        mais detalhes.
      </p>
      <div class="mt-8 flex justify-end">
        <button
          type="button"
          class="rounded-md bg-um-primary px-5 py-2 text-sm font-semibold text-black transition hover:bg-um-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="isSigningOutBlockedUser"
          @click="handleBlockedAccessSignOut"
        >
          Sair
        </button>
      </div>
    </section>
    <section v-else class="flex flex-col items-center gap-5 text-center">
      <LoaderCircle class="my-4 w-12 h-12 text-emerald-400 animate-spin" />
      <p class="text-white text-sm uppercase">{{ bootstrapStatusText }}</p>
    </section>
  </main>
</template>
