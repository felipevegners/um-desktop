import { getRequestURL } from 'h3';
import { UTApi, UTFile } from 'uploadthing/server';

const utapi = new UTApi({
  token: process.env.NUXT_UPLOADTHING_TOKEN,
});

const allowedEndpoints = new Set([
  'driverFiles',
  'driverCarFiles',
  'customerLogo',
  'productImage',
]);

export default defineEventHandler(async (event) => {
  console.log('[Files Handler] Request received');
  const url = getRequestURL(event);
  console.log('[Files Handler] URL:', url.toString());

  const files = await readMultipartFormData(event);
  console.log('[Files Handler] Files received:', files?.length || 0);
  const filePart = files?.find((part) => part.name === 'file') ?? files?.[0];

  if (!filePart?.data) {
    console.error('[Files Handler] No file data found in request');
    throw createError({
      statusCode: 400,
      statusMessage: 'Arquivo nao enviado.',
    });
  }

  console.log('[Files Handler] File data size:', filePart.data.length, 'bytes');

  const query = getQuery(event);
  const endpoint =
    typeof query.endpoint === 'string' && query.endpoint.length > 0
      ? query.endpoint
      : 'driverFiles';

  console.log('[Files Handler] Endpoint:', endpoint);
  if (!allowedEndpoints.has(endpoint)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Endpoint de upload invalido: ${endpoint}`,
    });
  }

  try {
    const filename = filePart.filename || `upload-${Date.now()}`;
    const mimeType = filePart.type || 'application/octet-stream';

    const customId = `${endpoint}_${Date.now()}_${filename}`;
    const uploadFile = new UTFile([new Uint8Array(filePart.data)], filename, {
      type: mimeType,
      customId,
    });

    console.log('[Files Handler] Uploading to UploadThing...');
    const result: any = await utapi.uploadFiles(uploadFile);
    console.log(
      '[Files Handler] UploadThing result:',
      JSON.stringify(result).substring(0, 200),
    );

    if (result?.error) {
      console.error('[Files Handler] UploadThing error:', result.error);
      throw createError({
        statusCode: 502,
        statusMessage: result.error?.message || 'Falha no upload do arquivo.',
      });
    }

    const responsePayload = {
      endpoint,
      data: {
        name: result?.data?.name || filename,
        key: result?.data?.key || result?.data?.fileKey,
        url: result?.data?.url || result?.data?.ufsUrl,
      },
    };
    console.log(
      '[Files Handler] Returning response:',
      JSON.stringify(responsePayload).substring(0, 200),
    );
    return responsePayload;
  } catch (error) {
    console.error('Error during file upload -> ', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro durante upload de arquivo.',
    });
  }
});
