# Prisma Error Handling Implementation Guide

## Overview
This document contains all the changes needed to implement proper Prisma error handling across the entire application. Review all changes before applying them.

## Architecture

### 1. **Error Handler Utility** ✅ CREATED
Location: `server/utils/prisma-error-handler.ts`
- Centralizes Prisma error handling
- Provides entity-specific error messages
- Converts technical errors to user-friendly messages

### 2. **Service Layer Pattern**
Services should propagate errors without modification:
```typescript
export const createItem = async (itemData: any) => {
  try {
    return await $fetch('/api/items', {
      method: 'POST',
      body: itemData,
    });
  } catch (error: any) {
    throw error; // Just propagate
  }
};
```

### 3. **Store Layer Pattern**
Stores should return success/error objects:
```typescript
async createItemAction(itemData: any) {
  this.isLoadingSend = true;
  try {
    const result = await createItem(itemData);
    return { success: true, data: result };
  } catch (error: any) {
    const message = error?.data?.message || error?.message || 'Erro desconhecido';
    return { 
      success: false, 
      error: message,
      statusCode: error?.statusCode || 500
    };
  } finally {
    this.isLoadingSend = false;
  }
}
```

### 4. **Frontend Pattern**
Components handle the response and show toast:
```typescript
const onSubmit = form.handleSubmit(async (values) => {
  const result = await store.createItemAction(values);
  
  if (result.success) {
    toast({
      title: 'Sucesso!',
      description: 'Item cadastrado com sucesso!',
      class: 'bg-green-600 border-0 text-white text-2xl',
    });
    navigateTo('/items/list');
  } else {
    toast({
      title: 'Erro!',
      description: result.error,
      variant: 'destructive',
    });
  }
});
```

## Files to Update

### API Endpoints (server/api/)

#### ✅ drivers.post.ts - ALREADY UPDATED
Current implementation looks good, already has proper error handling.

#### drivers.put.ts
```typescript
import { Prisma, prisma } from '~/utils/prisma';
import { handlePrismaError, ErrorMessages } from '~/server/utils/prisma-error-handler';

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);

  const {
    id,
    name,
    email,
    phone,
    document,
    driverLicense,
    licenseExpiration,
    licenseCategory,
    address,
    status,
    driverCars,
    driverFiles,
    rating,
    history,
    actuationArea,
    scheduleOpen,
    outsideActuation,
    location,
    enabled,
  } = payload;

  try {
    const updateDriver = await prisma.drivers.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        document,
        driverLicense,
        licenseExpiration,
        licenseCategory,
        address,
        status,
        driverCars,
        driverFiles,
        rating,
        history,
        actuationArea,
        scheduleOpen,
        outsideActuation,
        location,
        enabled,
      },
    });
    return updateDriver;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        handlePrismaError(error, ErrorMessages.Driver.update.notFound);
      }
      if (error.code === 'P2002') {
        handlePrismaError(error, ErrorMessages.Driver.update.duplicate);
      }
    }
    if (error instanceof Prisma.PrismaClientValidationError) {
      handlePrismaError(error, ErrorMessages.Driver.update.validation);
    }
    handlePrismaError(error, ErrorMessages.Driver.update.generic);
  }
});
```

#### auth/accounts.post.ts
```typescript
import { Prisma, prisma } from '@/utils/prisma';
import { handlePrismaError, ErrorMessages } from '~/server/utils/prisma-error-handler';
import bcrypt from 'bcrypt';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  
  if (!body.username || !body.email || !body.password || !body.role) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Campos obrigatórios inválidos',
    });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(body.password, salt);

  const {
    contract,
    username,
    email,
    role,
    enabled,
    status,
    avatar,
    phone,
    position,
    department,
    document,
    birthDate,
    acceptTerms,
    emailConfirmed,
  } = body;

  try {
    const newAccount = await prisma.accounts.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role,
        contract,
        enabled,
        status,
        avatar,
        phone,
        position,
        department,
        document,
        birthDate,
        acceptTerms,
        emailConfirmed,
      },
    });
    return newAccount;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        handlePrismaError(error, ErrorMessages.Account.create.duplicate);
      }
    }
    if (error instanceof Prisma.PrismaClientValidationError) {
      handlePrismaError(error, ErrorMessages.Account.create.validation);
    }
    handlePrismaError(error, ErrorMessages.Account.create.generic);
  }
});
```

#### auth/accounts.put.ts
```typescript
import { Prisma, prisma } from '@/utils/prisma';
import { handlePrismaError, ErrorMessages } from '~/server/utils/prisma-error-handler';
import bcrypt from 'bcrypt';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (!body.username || !body.email || !body.role) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Campos obrigatórios inválidos',
    });
  }

  const {
    accountId,
    contract,
    username,
    email,
    role,
    enabled,
    status,
    avatar,
    phone,
    position,
    department,
    document,
    birthDate,
    address,
  } = body;

  const userAccount = await prisma.accounts.findUnique({
    where: { id: accountId },
  });

  let hashedPassword;
  if (body.password) {
    const salt = await bcrypt.genSalt(10);
    hashedPassword = await bcrypt.hash(body.password, salt);
  } else {
    hashedPassword = userAccount?.password;
  }

  try {
    const updatedAccount = await prisma.accounts.update({
      where: { id: accountId },
      data: {
        username,
        email,
        password: hashedPassword,
        role,
        enabled,
        status,
        avatar,
        contract,
        phone,
        position,
        department,
        document,
        birthDate,
        address,
      },
    });
    return updatedAccount;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        handlePrismaError(error, ErrorMessages.Account.update.notFound);
      }
      if (error.code === 'P2002') {
        handlePrismaError(error, ErrorMessages.Account.update.duplicate);
      }
    }
    if (error instanceof Prisma.PrismaClientValidationError) {
      handlePrismaError(error, ErrorMessages.Account.update.validation);
    }
    handlePrismaError(error, ErrorMessages.Account.update.generic);
  }
});
```

#### branches.post.ts
```typescript
import { createUserAccountService } from '@/server/services/accounts';
import { Prisma, prisma } from '~/utils/prisma';
import { handlePrismaError, ErrorMessages } from '~/server/utils/prisma-error-handler';

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);

  const {
    contract,
    branchCode,
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
    branchManagerName,
    branchManagerPhone,
    branchManagerPosition,
    branchManagerDepartment,
    branchManagerEmail,
    branchBudget,
    password,
    areas,
  } = payload;

  try {
    const newBranch = await prisma.branches.create({
      data: {
        branchCode,
        name,
        document,
        fantasyName,
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
        budget: branchBudget,
        areas,
        status: 'pending',
        enabled: true,
      },
    });

    await prisma.contracts.update({
      where: { id: contract },
      data: {
        branches: {
          connect: { id: newBranch.id },
        },
      },
    });

    const branchManagerData = {
      username: branchManagerName,
      password: password,
      email: branchManagerEmail,
      role: 'branch-manager',
      contract: {
        contractId: contract,
        name: `${branchCode} - ${name}`,
        branchId: newBranch.id,
        area: 'all',
      },
      phone: branchManagerPhone,
      position: branchManagerPosition,
      department: branchManagerDepartment,
      status: 'pending',
      enabled: true,
      avatar: { name: '', url: '' },
      emailConfirmed: false,
      acceptTerms: false,
    };

    const newAccount = await createUserAccountService(branchManagerData);
    await prisma.branches.update({
      where: { id: newBranch.id },
      data: {
        manager: {
          connect: {
            //@ts-ignore
            id: newAccount?.id,
          },
        },
        contract: {
          connect: { id: contract },
        },
      },
    });

    return newBranch;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        handlePrismaError(error, ErrorMessages.Branch.create.duplicate);
      }
      if (error.code === 'P2003') {
        handlePrismaError(error, ErrorMessages.Branch.create.invalidReference);
      }
    }
    if (error instanceof Prisma.PrismaClientValidationError) {
      handlePrismaError(error, ErrorMessages.Branch.create.validation);
    }
    handlePrismaError(error, ErrorMessages.Branch.create.generic);
  }
});
```

#### branches.put.ts
```typescript
import { Prisma, prisma } from '~/utils/prisma';
import { handlePrismaError, ErrorMessages } from '~/server/utils/prisma-error-handler';

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);
  const {
    branchId,
    contract,
    branchCode,
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
    branchManagerName,
    branchManagerPhone,
    branchManagerPosition,
    branchManagerDepartment,
    branchBudget,
    areas,
    status,
    enabled,
  } = payload;

  try {
    const updatedBranch = await prisma.branches.update({
      where: { id: branchId },
      data: {
        branchCode,
        name,
        document,
        fantasyName,
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
        budget: branchBudget,
        areas,
        status,
        enabled,
      },
    });

    await prisma.contracts.update({
      where: { id: contract },
      data: {
        branches: {
          connect: { id: branchId },
        },
      },
    });

    return updatedBranch;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        handlePrismaError(error, ErrorMessages.Branch.update.notFound);
      }
      if (error.code === 'P2002') {
        handlePrismaError(error, ErrorMessages.Branch.update.duplicate);
      }
    }
    if (error instanceof Prisma.PrismaClientValidationError) {
      handlePrismaError(error, ErrorMessages.Branch.update.validation);
    }
    handlePrismaError(error, ErrorMessages.Branch.update.generic);
  }
});
```

#### customers.post.ts
```typescript
import { Prisma, prisma } from '~/utils/prisma';
import { handlePrismaError, ErrorMessages } from '~/server/utils/prisma-error-handler';

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);

  try {
    const newCustomer = await prisma.customers.create({ data: payload });
    return newCustomer;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        handlePrismaError(error, ErrorMessages.Customer.create.duplicate);
      }
    }
    if (error instanceof Prisma.PrismaClientValidationError) {
      handlePrismaError(error, ErrorMessages.Customer.create.validation);
    }
    handlePrismaError(error, ErrorMessages.Customer.create.generic);
  }
});
```

#### customers.put.ts
```typescript
import { Prisma, prisma } from '~/utils/prisma';
import { handlePrismaError, ErrorMessages } from '~/server/utils/prisma-error-handler';

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

  try {
    if (payload.passengers) {
      const updateCustomerPassengers = await prisma.customers.update({
        where: { id: payload.customer.id },
        data: {
          passengers: {
            connect: payload.passengers,
          },
        },
      });
      return updateCustomerPassengers;
    } else {
      const updateCustomer = await prisma.customers.update({
        where: { id: payload.id },
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
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        handlePrismaError(error, ErrorMessages.Customer.update.notFound);
      }
      if (error.code === 'P2002') {
        handlePrismaError(error, ErrorMessages.Customer.update.duplicate);
      }
    }
    if (error instanceof Prisma.PrismaClientValidationError) {
      handlePrismaError(error, ErrorMessages.Customer.update.validation);
    }
    handlePrismaError(error, ErrorMessages.Customer.update.generic);
  }
});
```

#### contracts.post.ts, contracts.put.ts, products.post.ts, products.put.ts, fees.post.ts, fees.put.ts, commissions.post.ts, commissions.put.ts, rides.post.ts, rides.put.ts
[Similar pattern - use the utility and appropriate ErrorMessages for each entity]

### Service Layer Updates

All service files should follow this pattern:

```typescript
// Example: server/services/drivers/index.ts
export const createDriver = async (driverData: Driver) => {
  try {
    return await $fetch('/api/drivers', {
      method: 'POST',
      body: driverData,
    });
  } catch (error: any) {
    throw error; // Just propagate, don't modify
  }
};

export const updateDriver = async (driverData: Driver) => {
  try {
    return await $fetch('/api/drivers', {
      method: 'PUT',
      body: driverData,
    });
  } catch (error) {
    throw error; // Just propagate, don't modify
  }
};
```

### Store Layer Updates

All stores should return success/error objects:

```typescript
// Example: stores/drivers.store.ts
async createNewDriverAction(driverData: Driver) {
  this.loadingSend = true;
  try {
    const result = await createDriver(driverData);
    return { success: true, data: result };
  } catch (error: any) {
    const message = error?.data?.message || error?.message || 'Erro desconhecido';
    return { 
      success: false, 
      error: message,
      statusCode: error?.statusCode || 500
    };
  } finally {
    this.loadingSend = false;
  }
}

async updateDriverAction(driverData: Driver) {
  this.loadingSend = true;
  try {
    const result = await updateDriver(driverData);
    return { success: true, data: result };
  } catch (error: any) {
    const message = error?.data?.message || error?.message || 'Erro desconhecido';
    return { 
      success: false, 
      error: message,
      statusCode: error?.statusCode || 500
    };
  } finally {
    this.loadingSend = false;
  }
}
```

Apply this pattern to all stores:
- `stores/account.store.ts`
- `stores/branches.store.ts`
- `stores/commissions.store.ts`
- `stores/contracts.store.ts`
- `stores/customers.store.ts`
- `stores/drivers.store.ts`
- `stores/fees.store.ts`
- `stores/products.store.ts`
- `stores/rides.store.ts`

### Frontend Component Updates

Update all components that call store actions:

```typescript
// Before
try {
  await store.createItemAction(data);
  toast({ title: 'Sucesso!', description: 'Item criado!' });
  navigateTo('/items');
} catch (error) {
  toast({ title: 'Erro!', description: `Erro: ${error}` });
}

// After
const result = await store.createItemAction(data);
if (result.success) {
  toast({
    title: 'Sucesso!',
    description: 'Item criado com sucesso!',
    class: 'bg-green-600 border-0 text-white text-2xl',
  });
  navigateTo('/items');
} else {
  toast({
    title: 'Erro!',
    description: result.error,
    variant: 'destructive',
  });
}
```

## Testing Checklist

After implementing all changes:

1. ✅ Test creating new records (POST endpoints)
2. ✅ Test updating existing records (PUT endpoints)
3. ✅ Test duplicate constraint violations
4. ✅ Test invalid references
5. ✅ Test validation errors
6. ✅ Test generic errors
7. ✅ Verify toast notifications show correct messages
8. ✅ Verify error messages are user-friendly (in Portuguese)
9. ✅ Verify console logs for debugging
10. ✅ Verify no silent failures

## Benefits

1. **Consistent Error Handling**: All endpoints handle errors the same way
2. **User-Friendly Messages**: Technical errors converted to Portuguese messages
3. **Proper HTTP Status Codes**: Correct status codes for each error type
4. **No Silent Failures**: All errors are caught and reported
5. **Toast Notifications**: Users see clear error messages in the UI
6. **Maintainable**: Centralized error handling utility
7. **Type-Safe**: TypeScript support throughout

## Next Steps

1. Review this implementation guide
2. Apply changes to API endpoints
3. Update service layer
4. Update store layer
5. Test thoroughly
6. Deploy to production
