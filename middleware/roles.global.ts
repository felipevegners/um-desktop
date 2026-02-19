export default defineNuxtRouteMiddleware((to, from) => {
  const { data, status } = useAuth();
  const adminRoutes = ['/admin'];
  const coporativeRoutes = ['/corporative/contract'];
  const testAdminPath = adminRoutes.some((el) => to.path.includes(el));
  const testCorpPath = coporativeRoutes.some((el) => to.path.includes(el));

  // Handle unauthenticated users and session expiration
  if (status.value === 'unauthenticated' && (testAdminPath || testCorpPath)) {
    return navigateTo({
      path: '/auth/login',
      query: {
        callbackUrl: to.fullPath,
      },
    });
  }

  //@ts-ignore
  if (testAdminPath && data?.value?.user.role !== 'admin') {
    return navigateTo('/forbidden');
  }

  //@ts-ignore
  if (testCorpPath && data?.value?.user.role !== 'master-manager') {
    return navigateTo('/forbidden');
  }
});
