import { prisma } from '~/utils/prisma';

const isExpoPushToken = (token: string) => {
  return (
    /^ExponentPushToken\[[^\]]+\]$/.test(token) || /^ExpoPushToken\[[^\]]+\]$/.test(token)
  );
};

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const { accountId, expoPushToken, platform, appVersion, deviceId } = body || {};

  if (!accountId || !expoPushToken) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'accountId e expoPushToken sao obrigatorios.',
    });
  }

  const account = (await prisma.accounts.findUnique({
    where: { id: accountId },
  })) as any;

  if (!account) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      message: 'Conta nao encontrada.',
    });
  }

  const tokenIsValid = isExpoPushToken(expoPushToken);

  const pushNotification = {
    ...(account.pushNotification || {}),
    expoPushToken,
    platform: platform || account.pushNotification?.platform || null,
    appVersion: appVersion || account.pushNotification?.appVersion || null,
    deviceId: deviceId || account.pushNotification?.deviceId || null,
    isTokenValid: tokenIsValid,
    lastValidatedAt: new Date(),
    lastReceiptError: tokenIsValid ? null : 'invalid-expo-token-format',
    updatedAt: new Date(),
  };

  await prisma.accounts.update({
    where: { id: accountId },
    data: {
      pushNotification,
    } as any,
  });

  return {
    success: true,
    isTokenValid: tokenIsValid,
  };
});
