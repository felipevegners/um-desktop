import { prisma } from '~/utils/prisma';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

type RidePushType = 'ride-assigned' | 'ride-cancelled';

type SendRidePushInput = {
  driverId: string;
  type: RidePushType;
  ride: any;
};

type ExpoPushTicket = {
  status?: string;
  id?: string;
  message?: string;
  details?: Record<string, unknown> & { error?: string };
};

type ExpoPushResponse = {
  data?: ExpoPushTicket | ExpoPushTicket[];
  errors?: Array<Record<string, unknown>>;
};

const isExpoPushToken = (token: string) => {
  return (
    /^ExponentPushToken\[[^\]]+\]$/.test(token) || /^ExpoPushToken\[[^\]]+\]$/.test(token)
  );
};

const getFirstAndSecondName = (fullName?: string) => {
  const parts = fullName?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return 'sem passageiro';
  return parts.slice(0, 2).join(' ');
};

const buildRidePushMessage = (type: RidePushType, ride: any, token: string) => {
  const rideCode = ride?.code || 'sem codigo';
  const rideUser = getFirstAndSecondName(ride?.user?.name);

  if (type === 'ride-assigned') {
    return {
      to: token,
      sound: 'default',
      priority: 'high',
      channelId: 'rides-events',
      title: 'Novo Atendimento UM',
      body: `Atendimento ${rideCode} de ${rideUser} está aguardando sua confirmação. Toque para aceitar ou recusar.`,
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
    body: `Atendimento ${rideCode} de ${rideUser} foi cancelado pelo backoffice.`,
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

  const message = buildRidePushMessage(type, ride, token);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (process.env.EXPO_ACCESS_TOKEN) {
    headers.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
  }

  try {
    const rawResponse = await $fetch<
      ExpoPushResponse | ExpoPushTicket | ExpoPushTicket[]
    >(EXPO_PUSH_URL, {
      method: 'POST',
      headers,
      body: message,
    });

    const response = rawResponse as ExpoPushResponse | ExpoPushTicket | ExpoPushTicket[];
    const responseObject =
      response && !Array.isArray(response) && typeof response === 'object'
        ? (response as Record<string, unknown>)
        : null;
    const responseData = responseObject?.data as
      | ExpoPushTicket
      | ExpoPushTicket[]
      | undefined;

    const ticketList = Array.isArray(response)
      ? response
      : Array.isArray(responseData)
        ? responseData
        : responseData
          ? [responseData]
          : responseObject && 'status' in responseObject
            ? [response as ExpoPushTicket]
            : [];

    const responseErrors =
      (responseObject?.errors as Array<Record<string, unknown>> | undefined) ?? null;

    const firstTicket = ticketList[0];
    const ticketError = firstTicket?.details?.error;
    const ticketMessage = firstTicket?.message;
    const ticketStatus = firstTicket?.status;
    const emptyResponse = ticketList.length === 0 && !responseErrors;

    const tokenStillValid = ticketStatus === 'ok' && !ticketError;

    const lastReceiptError = emptyResponse
      ? 'expo-empty-response'
      : ticketError || ticketMessage || null;

    await prisma.accounts.update({
      where: { id: driverId },
      data: {
        pushNotification: {
          ...(account?.pushNotification || {}),
          isTokenValid: tokenStillValid,
          lastValidatedAt: new Date(),
          lastReceiptError,
          updatedAt: new Date(),
        },
      } as any,
    });

    return {
      sent: tokenStillValid,
      reason: tokenStillValid
        ? 'ok'
        : emptyResponse
          ? 'expo-empty-response'
          : ticketError || ticketMessage || 'expo-ticket-error',
      expoTicket: firstTicket ?? null,
      expoErrors: responseErrors,
      rawResponse,
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
