import { Prisma } from '~/utils/prisma';

/**
 * Prisma Error Handler Utility
 * Converts Prisma errors into user-friendly HTTP errors
 */

interface PrismaErrorMap {
  [key: string]: {
    statusCode: number;
    defaultMessage: string;
  };
}

const prismaErrorMap: PrismaErrorMap = {
  P2002: {
    statusCode: 409,
    defaultMessage: 'Já existe um registro com estes dados.',
  },
  P2025: {
    statusCode: 404,
    defaultMessage: 'Registro não encontrado.',
  },
  P2003: {
    statusCode: 400,
    defaultMessage: 'Referência inválida aos dados relacionados.',
  },
  P2000: {
    statusCode: 400,
    defaultMessage: 'Valor muito longo para o campo.',
  },
  P2001: {
    statusCode: 404,
    defaultMessage: 'Registro não existe.',
  },
  P2014: {
    statusCode: 400,
    defaultMessage: 'Relação obrigatória não fornecida.',
  },
  P2011: {
    statusCode: 400,
    defaultMessage: 'Valor obrigatório não fornecido.',
  },
  P2012: {
    statusCode: 400,
    defaultMessage: 'Valor obrigatório ausente.',
  },
  P2015: {
    statusCode: 404,
    defaultMessage: 'Registro relacionado não encontrado.',
  },
  P2016: {
    statusCode: 400,
    defaultMessage: 'Erro de interpretação da query.',
  },
  P2017: {
    statusCode: 400,
    defaultMessage: 'Registros relacionados não conectados.',
  },
  P2018: {
    statusCode: 404,
    defaultMessage: 'Registros conectados necessários não encontrados.',
  },
  P2019: {
    statusCode: 400,
    defaultMessage: 'Erro de entrada de dados.',
  },
  P2020: {
    statusCode: 400,
    defaultMessage: 'Valor fora dos limites para o tipo.',
  },
  P2021: {
    statusCode: 500,
    defaultMessage: 'Tabela não existe no banco de dados.',
  },
  P2022: {
    statusCode: 500,
    defaultMessage: 'Coluna não existe no banco de dados.',
  },
};

/**
 * Handles Prisma errors and throws appropriate HTTP errors
 * @param error - The caught error
 * @param customMessage - Optional custom message to override default
 */
export function handlePrismaError(error: unknown, customMessage?: string): never {
  // Handle Prisma Known Request Errors (with error codes)
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const errorInfo = prismaErrorMap[error.code];

    if (errorInfo) {
      throw createError({
        statusCode: errorInfo.statusCode,
        statusMessage: getStatusMessage(errorInfo.statusCode),
        message: customMessage || errorInfo.defaultMessage,
      });
    }

    // Unknown Prisma error code
    console.error('Unknown Prisma error code:', error.code, error.message);
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: customMessage || 'Erro ao processar a solicitação.',
    });
  }

  // Handle Prisma Validation Errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: customMessage || 'Dados inválidos fornecidos.',
    });
  }

  // Handle Prisma Initialization Errors
  if (error instanceof Prisma.PrismaClientInitializationError) {
    console.error('Prisma initialization error:', error.message);
    throw createError({
      statusCode: 503,
      statusMessage: 'Service Unavailable',
      message: 'Serviço temporariamente indisponível. Tente novamente mais tarde.',
    });
  }

  // Handle Prisma Rust Panic Errors
  if (error instanceof Prisma.PrismaClientRustPanicError) {
    console.error('Prisma panic error:', error.message);
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Erro interno do servidor.',
    });
  }

  // Generic error fallback
  console.error('Unexpected error:', error);
  throw createError({
    statusCode: 500,
    statusMessage: 'Internal Server Error',
    message: customMessage || 'Ocorreu um erro interno. Tente novamente.',
  });
}

/**
 * Gets appropriate status message for HTTP status code
 */
function getStatusMessage(statusCode: number): string {
  const statusMessages: { [key: number]: string } = {
    400: 'Bad Request',
    404: 'Not Found',
    409: 'Conflict',
    500: 'Internal Server Error',
    503: 'Service Unavailable',
  };

  return statusMessages[statusCode] || 'Error';
}

/**
 * Custom error messages for specific entities
 */
export const ErrorMessages = {
  Driver: {
    create: {
      duplicate: 'Já existe um motorista com este e-mail ou documento.',
      invalidReference: 'Dados de referência inválidos para o motorista.',
      validation: 'Dados de motorista inválidos.',
      generic: 'Erro ao cadastrar motorista. Tente novamente.',
    },
    update: {
      notFound: 'Motorista não encontrado.',
      duplicate: 'Já existe outro motorista com estes dados.',
      validation: 'Dados de atualização inválidos.',
      generic: 'Erro ao atualizar motorista. Tente novamente.',
    },
  },
  Account: {
    create: {
      duplicate: 'Já existe uma conta com este e-mail.',
      validation: 'Dados de conta inválidos.',
      generic: 'Erro ao criar conta. Tente novamente.',
    },
    update: {
      notFound: 'Conta não encontrada.',
      duplicate: 'Já existe outra conta com este e-mail.',
      validation: 'Dados de atualização inválidos.',
      generic: 'Erro ao atualizar conta. Tente novamente.',
    },
  },
  Branch: {
    create: {
      duplicate: 'Já existe uma filial com este CNPJ.',
      invalidReference: 'Contrato ou dados relacionados inválidos.',
      validation: 'Dados de filial inválidos.',
      generic: 'Erro ao cadastrar filial. Tente novamente.',
    },
    update: {
      notFound: 'Filial não encontrada.',
      duplicate: 'Já existe outra filial com estes dados.',
      validation: 'Dados de atualização inválidos.',
      generic: 'Erro ao atualizar filial. Tente novamente.',
    },
  },
  Contract: {
    create: {
      duplicate: 'Já existe um contrato para este cliente.',
      invalidReference: 'Cliente ou dados relacionados inválidos.',
      validation: 'Dados de contrato inválidos.',
      generic: 'Erro ao criar contrato. Tente novamente.',
    },
    update: {
      notFound: 'Contrato não encontrado.',
      duplicate: 'Já existe outro contrato com estes dados.',
      validation: 'Dados de atualização inválidos.',
      generic: 'Erro ao atualizar contrato. Tente novamente.',
    },
  },
  Customer: {
    create: {
      duplicate: 'Já existe um cliente com este documento.',
      validation: 'Dados de cliente inválidos.',
      generic: 'Erro ao cadastrar cliente. Tente novamente.',
    },
    update: {
      notFound: 'Cliente não encontrado.',
      duplicate: 'Já existe outro cliente com este documento.',
      validation: 'Dados de atualização inválidos.',
      generic: 'Erro ao atualizar cliente. Tente novamente.',
    },
  },
  Ride: {
    create: {
      duplicate: 'Já existe uma corrida com este código.',
      invalidReference: 'Motorista, produto ou dados relacionados inválidos.',
      validation: 'Dados do atendimento inválidos.',
      generic: 'Erro ao criar corrida. Tente novamente.',
    },
    update: {
      notFound: 'Corrida não encontrada.',
      validation: 'Dados de atualização inválidos.',
      generic: 'Erro ao atualizar corrida. Tente novamente.',
    },
  },
  Product: {
    create: {
      duplicate: 'Já existe um produto com este código.',
      validation: 'Dados de produto inválidos.',
      generic: 'Erro ao cadastrar produto. Tente novamente.',
    },
    update: {
      notFound: 'Produto não encontrado.',
      duplicate: 'Já existe outro produto com este código.',
      validation: 'Dados de atualização inválidos.',
      generic: 'Erro ao atualizar produto. Tente novamente.',
    },
  },
  Fee: {
    create: {
      duplicate: 'Já existe uma taxa com este nome.',
      validation: 'Dados de taxa inválidos.',
      generic: 'Erro ao cadastrar taxa. Tente novamente.',
    },
    update: {
      notFound: 'Taxa não encontrada.',
      duplicate: 'Já existe outra taxa com este nome.',
      validation: 'Dados de atualização inválidos.',
      generic: 'Erro ao atualizar taxa. Tente novamente.',
    },
  },
  Commission: {
    create: {
      duplicate: 'Já existe uma comissão registrada para esta corrida.',
      invalidReference: 'Corrida ou motorista inválidos.',
      validation: 'Dados de comissão inválidos.',
      generic: 'Erro ao cadastrar comissão. Tente novamente.',
    },
    update: {
      notFound: 'Comissão não encontrada.',
      validation: 'Dados de atualização inválidos.',
      generic: 'Erro ao atualizar comissão. Tente novamente.',
    },
  },
};
