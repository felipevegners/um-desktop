import { prisma } from '~/utils/prisma';

export default defineEventHandler(async (event) => {
    const payload = await readBody(event);
    const {
        name,
        status,
        fantasyName,
        document,
        zipcode,
        streetName,
        streetNumber,
        complement,
        neighborhood,
        city,
        state,
        phone,
        website,
        managerName,
        managerPhone,
        managerEmail,
        ccAreas,
        enabled,
        logo,
    } = payload;

    if (payload.passengers) {
        const updateCustomerPassegners = await prisma.customers.update({
            where: {
                id: payload.customer.id,
            },
            data: {
                passengers: {
                    connect: payload.passengers,
                    // [{id: 123}, {id: 345}, ...]
                },
            },
        });

        return updateCustomerPassegners;
    } else {
        const updateCustomer = await prisma.customers.update({
            where: {
                id: payload.id,
            },
            data: {
                status,
                name,
                fantasyName,
                document,
                address: {
                    zipcode,
                    streetName,
                    streetNumber,
                    complement,
                    neighborhood,
                    city,
                    state,
                },
                phone,
                website,
                managerName,
                managerPhone,
                managerEmail,
                ccAreas,
                logo,
                enabled,
            },
        });
        return updateCustomer;
    }
});
