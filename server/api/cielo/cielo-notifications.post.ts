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
  try {
    const rideByCode = await prisma.rides.findFirst({
      where: {
        code: body.order_number,
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
            status: CieloPaymentStatus[body.payment_status],
            installments: body.payment_installments,
            date: body.created_date,
          },
        },
      });
    }
    // console.log('Notification Body -> ', body);
    return JSON.stringify(body);
  } catch (error) {
    console.error(error);
  }
});
