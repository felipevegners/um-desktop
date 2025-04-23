import { createUserAccountService } from '~/server/services/accounts';
import { Prisma, prisma } from '~/utils/prisma';

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);

  const {
    logo,
    name,
    document,
    fantasyName,
    zipcode,
    streetName,
    streetNumber,
    complement,
    neighborhood,
    city,
    state,
    phone,
    phoneExtension,
    website,
    managerName,
    managerCellPhone,
    position,
    department,
    managerEmail,
    password,
    paymentTerm,
    paymentDueDate,
    products,
    additionalInfo,
  } = payload;

  const customer = {
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
    phoneExtension,
    website,
    logo,
    enabled: true,
    status: 'active',
  };

  const comercialConditions = {
    paymentTerm,
    paymentDueDate,
  };

  try {
    //Create the company record
    const newCustomer = await prisma.customers.create({ data: customer });

    //Create the new contract with company and master manager data
    const newContract = await prisma.contracts.create({
      data: {
        customerName: newCustomer.fantasyName,
        customer: {
          connect: {
            id: newCustomer.id,
          },
        },
        comercialConditions,
        products,
        additionalInfo,
        enabled: true,
        status: 'pending',
      },
    });
    // Create master manager user account
    const newAccountData = {
      username: managerName,
      email: managerEmail,
      password: password,
      role: 'master-manager',
      status: 'pending',
      enabled: true,
      contractId: newContract.id,
      // customerName: newCustomer.fantasyName,
      // customerId: newCustomer.id,
    };
    const newAccount = await createUserAccountService(newAccountData);
    await prisma.contracts.update({
      where: {
        id: newContract.id,
      },
      data: {
        manager: {
          connect: {
            //@ts-ignore
            id: newAccount?.id,
          },
        },
      },
    });
    return newContract;
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.log('Error Prisma -> ', error);
      throw error;
    }
    throw error;
  }
});
