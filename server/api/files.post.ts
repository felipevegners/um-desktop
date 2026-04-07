import { UTApi, UTFile } from 'uploadthing/server';

const utapi = new UTApi({
  token: process.env.NUXT_UPLOADTHING_TOKEN,
});

export default defineEventHandler(async (event) => {
  const files = await readMultipartFormData(event);
  const filePart = files?.find((part) => part.name === 'file') ?? files?.[0];

  if (!filePart?.data) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Arquivo nao enviado.',
    });
  }

  const query = getQuery(event);
  const endpoint =
    typeof query.endpoint === 'string' && query.endpoint.length > 0
      ? query.endpoint
      : 'driverFiles';

  try {
    const filename = filePart.filename || `upload-${Date.now()}`;
    const mimeType = filePart.type || 'application/octet-stream';

    const uploadFile = new UTFile([new Uint8Array(filePart.data)], filename, {
      type: mimeType,
    });

    const result: any = await utapi.uploadFiles(uploadFile);

    if (result?.error) {
      throw createError({
        statusCode: 502,
        statusMessage: result.error?.message || 'Falha no upload do arquivo.',
      });
    }

    return {
      endpoint,
      data: {
        name: result?.data?.name || filename,
        key: result?.data?.key || result?.data?.fileKey,
        url: result?.data?.url || result?.data?.ufsUrl,
      },
    };
  } catch (error) {
    console.error('Error during file upload -> ', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro durante upload de arquivo.',
    });
  }
});
