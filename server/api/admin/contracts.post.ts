import { Prisma, prisma } from '~/utils/prisma';

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);
  console.log('CREATE CONTRACT --->', payload);

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

  const company = {
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

  const masterManager = {
    name: managerName,
    phone: managerCellPhone,
    email: managerEmail,
    position,
    department,
    password,
  };

  const comercialConditions = {
    paymentTerm,
    paymentDueDate,
  };

  try {
    const newCompany = await prisma.customers.create({ data: company });
    const newMasterManager = await prisma.masterManager.create({
      data: masterManager,
    });
    const newContract = await prisma.contracts.create({
      data: {
        customerName: newCompany.fantasyName,
        managerName: newMasterManager.name,
        managerEmail: newMasterManager.email,
        customerBranches: [],
        customerUsers: [],
        comercialConditions,
        products,
        additionalInfo,
        enabled: true,
        status: 'pending',
        customer: {
          connect: {
            id: newCompany.id,
          },
        },
        manager: {
          connect: {
            id: newMasterManager.id,
          },
        },
      },
    });
    return newContract;
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.log('Error Prisma -> ', error.message);
      throw new Error('Erro ao cadastrar novo contrato no DB', {
        cause: error.message,
      });
    }
    throw new Error('Erro ao cadastrar novo contrato no DB', {
      cause: error.message,
    });
  }
});
