export default defineNuxtRouteMiddleware((to, from) => {
  const { data } = useAuth();
  const adminRoutes = ['/admin'];
  const testPath = adminRoutes.some((el) => to.path.includes(el));

  //@ts-ignore
  if (testPath && data?.value?.user.role !== 'admin') {
    return navigateTo('/forbidden');
  }
});
