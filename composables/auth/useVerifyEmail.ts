export default function useVerifyEmail() {
  const route = useRoute();
  const status = ref<'idle' | 'loading' | 'success' | 'error'>('idle');
  const error = ref<string | null>(null); // Add reactive error state
  const verifyEmail = async () => {
    status.value = 'loading'; // Set status to loading
    const token = route.query.token as string;

    if (!token) {
      navigateTo('/register'); // If there's no token, navigate the user to register.
      return;
    }

    try {
      const result = await $fetch('/api/auth/validate', {
        query: { token },
        method: 'POST',
      });

      if (result.status !== 200) {
        error.value = result.body.message; // Set error message
        status.value = 'error'; // Set status to loading
        return;
      }

      status.value = 'success'; // Set status to loading
      error.value = null; // Clear error if request is successful
    } catch (e) {
      error.value = (e as Error).message || 'Ocorreu um erro ao verificar o e-mail.';
      status.value = 'error'; // Set status to loading
    }
  };
  return {
    verifyEmail,
    error,
    status,
  };
}
