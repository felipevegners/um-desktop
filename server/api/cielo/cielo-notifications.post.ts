import { cieloService } from '@/server/services/cielo';
import { Prisma, prisma } from '~/utils/prisma';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { Url } = body;

  const CieloPaymentStatus = {
    1: 'pending',
    2: 'paid',
    3: 'denied',
    4: 'expired',
    5: 'cancelled',
    6: 'error',
    7: 'authorized',
  };

  try {
    const paymentStatus = await cieloService.getCieloPaymentStatus(Url);
    const sanitizeOrderNumber = paymentStatus?.order_number.replace('UM', '');

    const rideByCode = await prisma.rides.findFirst({
      where: {
        code: `UM-${sanitizeOrderNumber}`,
      },
    });

    const { billing }: any = rideByCode;

    if (rideByCode) {
      await prisma.rides.update({
        where: {
          id: rideByCode.id,
        },
        data: {
          billing: {
            ...billing,
            //@ts-ignore
            status: CieloPaymentStatus[paymentStatus.payment_status],
            installments: paymentStatus.payment_installments,
            date: paymentStatus.created_date,
          },
        },
      });
    }

    return JSON.stringify(paymentStatus);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.log('Error Prisma -> ', error);
      throw error;
    }
    console.error('Cielo Notification Catch Error ->', error);
    return error;
  }
});
