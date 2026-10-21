import { resolveUmApiBaseUrl } from '@/server/utils/um-api';

// Delega o envio ao um-api (token opaco + Resend); nunca lança erro.
export const sendVerificationEmailService = async (email: string): Promise<boolean> => {
  try {
    await $fetch('/auth/resend-verification', {
      baseURL: resolveUmApiBaseUrl(),
      method: 'POST',
      timeout: 20000,
      body: { email },
    });
    return true;
  } catch (error: any) {
    console.error(
      'ERROR DURING VERIFICATION EMAIL REQUEST -> ',
      error?.data?.message || error?.message,
    );
    return false;
  }
};
