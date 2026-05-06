export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const apiBaseUrl = process.env.UM_API_BASE_URL || 'https://um-api-pu0t.onrender.com';

  await $fetch(`${apiBaseUrl}/auth/reset-password`, { method: 'POST', body });

  return { success: true };
});
