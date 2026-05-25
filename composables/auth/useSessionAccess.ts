export function useSessionAccess() {
  const { data, status } = useAuth();

  const user = computed(() => (data.value?.user as any) ?? null);
  const role = computed(() => user.value?.role as string | undefined);
  const contractId = computed(
    () => user.value?.contract?.contractId as string | undefined,
  );
  const userBranches = computed(() => {
    const branches = user.value?.contract?.branches as
      | Array<{ id?: string | null }>
      | undefined;

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

  const hasSessionData = (
    requirements: {
      requireUserId?: boolean;
      requireRole?: boolean;
      requireContractId?: boolean;
      requireBranchId?: boolean;
    } = {},
  ) => {
    const authOk = status.value === 'authenticated';
    if (!authOk) return false;

    if (requirements.requireUserId && !user.value?.id) return false;
    if (requirements.requireRole && !role.value) return false;
    if (requirements.requireContractId && !contractId.value) return false;

    if (requirements.requireBranchId) {
      const branchFromContract = user.value?.contract?.branchId;
      const hasBranchFromList = userBranches.value.length > 0;
      if (!branchFromContract && !hasBranchFromList) return false;
    }

    return true;
  };

  const waitForSessionData = async (
    requirements: {
      requireUserId?: boolean;
      requireRole?: boolean;
      requireContractId?: boolean;
      requireBranchId?: boolean;
      timeoutMs?: number;
    } = {},
  ) => {
    const timeoutMs = requirements.timeoutMs ?? 20000;

    if (status.value === 'unauthenticated') return false;
    if (hasSessionData(requirements)) return true;

    return await new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => {
        stop();
        resolve(false);
      }, timeoutMs);

      const stop = watch(
        [status, user, role, contractId, userBranches],
        () => {
          if (status.value === 'unauthenticated') {
            clearTimeout(timeout);
            stop();
            resolve(false);
            return;
          }

          if (hasSessionData(requirements)) {
            clearTimeout(timeout);
            stop();
            resolve(true);
          }
        },
        { immediate: true, deep: false },
      );
    });
  };

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
    hasSessionData,
    waitForSessionData,
  };
}
