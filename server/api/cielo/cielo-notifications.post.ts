import { cieloService } from '@/server/services/cielo';
import { prisma } from '~/utils/prisma';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const CieloPaymentStatus = {
    1: 'pending',
    2: 'paid',
    3: 'denied',
    4: 'expired',
    5: 'cancelled',
    6: 'error',
    7: 'authorized',
  };

  const { url } = body;

  try {
    const paymentStatus = await cieloService.getCieloPaymentStatus(url);

    const rideByCode = await prisma.rides.findFirst({
      where: {
        code: paymentStatus.order_number,
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

    // return JSON.stringify(paymentStatus);
  } catch (error) {
    console.error('Cielo Notification Catch Error ->', error);
  }
});
