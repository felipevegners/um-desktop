export function useSessionAccess() {
  const { data, status } = useAuth();

  const user = computed(() => (data.value?.user as any) ?? null);
  const role = computed(() => user.value?.role as string | undefined);
  const contractId = computed(
    () => user.value?.contract?.contractId as string | undefined,
  );
  const userBranches = computed(
    () => (user.value?.contract?.branches as Array<{ id?: string | null }>) || [],
  );
  const permissions = computed(() =>
    Array.isArray(user.value?.permissions) ? user.value.permissions : [],
  );
  const isAdmin = computed(() => role.value === 'admin');
  const isMasterManager = computed(() => role.value === 'master-manager');

  return {
    data,
    status,
    user,
    role,
    contractId,
    userBranches,
    permissions,
    isAdmin,
    isMasterManager,
  };
}
