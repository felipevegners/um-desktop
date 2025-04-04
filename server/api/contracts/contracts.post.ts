import { prisma } from '~/utils/prisma';

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
    status: 'pending',
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

  const services = {};

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
      services: [],
      enabled: true,
      status: 'active',
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
});
