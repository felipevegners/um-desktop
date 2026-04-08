export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  if (!query.token) {
    return {
      status: 400,
      body: { message: 'Invalid token' },
    };
  }

  const apiBaseUrl =
    process.env.UM_API_BASE_URL ||
    process.env.EXPO_PUBLIC_UM_API_URL ||
    'https://um-api-pu0t.onrender.com';

  const verifyUrl = new URL('/auth/verify-email', apiBaseUrl);

  // Verify email using the new um-api source of truth.
  try {
    const result = await $fetch<{ message: string; email: string }>(
      verifyUrl.toString(),
      {
        method: 'GET',
        query: { token: query.token },
      },
    );

    return {
      status: 200,
      body: { message: result.message, email: result.email },
    };
  } catch (e) {
    const message =
      (e as { data?: { message?: string } })?.data?.message ||
      'Desculpe, o código de verificação é inválido.';

    return {
      status: 400,
      body: {
        message,
      },
    };
  }
});
