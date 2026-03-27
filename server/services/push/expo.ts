import { prisma } from '~/utils/prisma';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

type RidePushType = 'ride-assigned' | 'ride-cancelled';

type SendRidePushInput = {
  driverId: string;
  type: RidePushType;
  ride: any;
};

const isExpoPushToken = (token: string) => {
  return (
    /^ExponentPushToken\[[^\]]+\]$/.test(token) || /^ExpoPushToken\[[^\]]+\]$/.test(token)
  );
};

const buildRidePushMessage = (type: RidePushType, ride: any, token: string) => {
  const rideCode = ride?.code || 'sem codigo';

  if (type === 'ride-assigned') {
    return {
      to: token,
      sound: 'default',
      priority: 'high',
      channelId: 'rides-events',
      title: 'Novo atendimento atribuido',
      body: `Atendimento ${rideCode} aguardando aceite.`,
      data: {
        type: 'pending-ride',
        rideId: ride?.id,
        rideRef: rideCode,
      },
    };
  }

  return {
    to: token,
    sound: 'default',
    priority: 'high',
    channelId: 'rides-events',
    title: 'Atendimento cancelado',
    body: `Atendimento ${rideCode} foi cancelado pelo backoffice.`,
    data: {
      type: 'ride-cancelled',
      rideId: ride?.id,
      rideRef: rideCode,
    },
  };
};

export const sendRidePushIfEligible = async ({
  driverId,
  type,
  ride,
}: SendRidePushInput) => {
  if (!driverId) return { sent: false, reason: 'missing-driver-id' };

  const account = (await prisma.accounts.findUnique({
    where: { id: driverId },
  })) as any;

  const token = account?.pushNotification?.expoPushToken;
  const isTokenValid = account?.pushNotification?.isTokenValid;

  if (!token) {
    return { sent: false, reason: 'missing-token' };
  }

  if (!isExpoPushToken(token)) {
    await prisma.accounts.update({
      where: { id: driverId },
      data: {
        pushNotification: {
          ...(account?.pushNotification || {}),
          isTokenValid: false,
          lastValidatedAt: new Date(),
          lastReceiptError: 'invalid-expo-token-format',
          updatedAt: new Date(),
        },
      } as any,
    });

    return { sent: false, reason: 'invalid-token-format' };
  }

  if (isTokenValid === false) {
    return { sent: false, reason: 'token-marked-invalid' };
  }

  const message = buildRidePushMessage(type, ride, token);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (process.env.EXPO_ACCESS_TOKEN) {
    headers.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
  }

  try {
    const response = await $fetch<{
      data?: Array<{ status: string; details?: { error?: string } }>;
    }>(EXPO_PUSH_URL, {
      method: 'POST',
      headers,
      body: message,
    });

    const firstTicket = response?.data?.[0];
    const ticketError = firstTicket?.details?.error;

    const tokenStillValid = firstTicket?.status === 'ok' && !ticketError;

    await prisma.accounts.update({
      where: { id: driverId },
      data: {
        pushNotification: {
          ...(account?.pushNotification || {}),
          isTokenValid: tokenStillValid,
          lastValidatedAt: new Date(),
          lastReceiptError: ticketError || null,
          updatedAt: new Date(),
        },
      } as any,
    });

    return {
      sent: tokenStillValid,
      reason: tokenStillValid ? 'ok' : ticketError || 'expo-ticket-error',
    };
  } catch (error) {
    await prisma.accounts.update({
      where: { id: driverId },
      data: {
        pushNotification: {
          ...(account?.pushNotification || {}),
          isTokenValid: false,
          lastValidatedAt: new Date(),
          lastReceiptError: 'send-failed',
          updatedAt: new Date(),
        },
      } as any,
    });

    return { sent: false, reason: 'send-failed', error };
  }
};
