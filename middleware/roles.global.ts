export default defineNuxtRouteMiddleware((to, from) => {
  const { data } = useAuth();
  const adminRoutes = ['/admin'];
  const coporativeRoutes = ['/corporative/contract'];
  const testAdminPath = adminRoutes.some((el) => to.path.includes(el));
  const testCorpPath = coporativeRoutes.some((el) => to.path.includes(el));

  //@ts-ignore
  if (testAdminPath && data?.value?.user.role !== 'admin') {
    return navigateTo('/forbidden');
  }

  //@ts-ignore
  if (testCorpPath && data?.value?.user.role !== 'master-manager') {
    return navigateTo('/forbidden');
  }
});
