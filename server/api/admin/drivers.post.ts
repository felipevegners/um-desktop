import { prisma } from '~/utils/prisma';

export default defineEventHandler(async (event) => {
    const payload = await readBody(event);
    const newDriver = await prisma.drivers.create({
        data: payload,
    });

    return newDriver;
});
