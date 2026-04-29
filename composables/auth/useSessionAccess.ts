export function useSessionAccess() {
  const { data, status } = useAuth();

  const user = computed(() => (data.value?.user as any) ?? null);
  const role = computed(() => user.value?.role as string | undefined);
  const contractId = computed(
    () => user.value?.contract?.contractId as string | undefined,
  );
  const userBranches = computed(() => {
    const branches = (user.value?.contract?.branches as
      | Array<{ id?: string | null }>
      | undefined);

    if (Array.isArray(branches) && branches.length > 0) return branches;

    const branchId = user.value?.contract?.branchId as string | undefined;
    if (branchId) return [{ id: branchId }];

    return [] as Array<{ id?: string | null }>;
  });
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
