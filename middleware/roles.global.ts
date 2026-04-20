export default defineNuxtRouteMiddleware(async (to, from) => {
  // Canonicalize legacy rides routes to the new form routes.
  if (to.path === '/admin/rides/new' || to.path === '/corporative/rides/new') {
    return navigateTo('/rides/form/new');
  }

  const legacyListMatch = to.path.match(
    /^\/(admin|corporative)\/rides\/(open|active|completed|cancelled|canceled)$/,
  );
  if (legacyListMatch) {
    const rawView = legacyListMatch[2];
    const normalizedView =
      rawView === 'active' ? 'open' : rawView === 'canceled' ? 'cancelled' : rawView;

    return navigateTo(`/rides/list/${normalizedView}`);
  }

  const legacyEditMatch = to.path.match(/^\/(admin|corporative)\/rides\/edit\/([^/]+)$/);
  if (legacyEditMatch) {
    const legacyRef = legacyEditMatch[2];

    if (legacyRef === 'current') {
      return;
    }

    if (legacyRef.startsWith('UM-')) {
      return navigateTo(`/rides/form/edit/${legacyRef}`);
    }

    try {
      const payload: any = await $fetch(`/api/rides?id=${encodeURIComponent(legacyRef)}`);
      const code = payload?.ride?.code || payload?.code;

      if (typeof code === 'string' && code.startsWith('UM-')) {
        return navigateTo(`/rides/form/edit/${code}`);
      }

      return navigateTo('/forbidden');
    } catch (error) {
      return navigateTo('/forbidden');
    }
  }

  const { data, status } = useAuth();
  const adminRoutes = ['/admin'];
  const corporativeRoutes = ['/corporative'];
  const sharedProtectedRoutes = ['/rides/form', '/rides/list'];
  const testAdminPath = adminRoutes.some((el) => to.path.startsWith(el));
  const testCorpPath = corporativeRoutes.some((el) => to.path.startsWith(el));
  const testSharedPath = sharedProtectedRoutes.some((el) => to.path.startsWith(el));
  const isProtectedPath = testAdminPath || testCorpPath || testSharedPath;

  // Handle unauthenticated users and session expiration
  if (status.value === 'unauthenticated' && isProtectedPath) {
    return navigateTo({
      path: '/auth/login',
      query: {
        callbackUrl: to.fullPath,
      },
    });
  }

  const userRole = (data.value as any)?.user?.role as string | undefined;

  if (testAdminPath && userRole !== 'admin') {
    return navigateTo('/forbidden');
  }

  const corporativeAllowedRoles = [
    'admin',
    'master-manager',
    'branch-manager',
    'platform-admin',
  ];

  if (
    (testCorpPath || testSharedPath) &&
    !corporativeAllowedRoles.includes(userRole ?? '')
  ) {
    return navigateTo('/forbidden');
  }
});
