export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const apiBaseUrl = process.env.UM_API_BASE_URL || 'https://um-api-pu0t.onrender.com';

  const result = await $fetch<{ success: boolean; requestId: string; expiresIn: number }>(
    `${apiBaseUrl}/auth/request-password-reset`,
    { method: 'POST', body },
  );

  return result;
});
