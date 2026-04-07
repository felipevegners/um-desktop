import { UTApi } from 'uploadthing/server';

const utapi = new UTApi({
  token: process.env.NUXT_UPLOADTHING_TOKEN,
});

export default defineEventHandler(async (event) => {
  const data = await readBody(event);
  const fileKey = typeof data?.fileKey === 'string' ? data.fileKey.trim() : '';
  const fileUrl = typeof data?.fileUrl === 'string' ? data.fileUrl.trim() : '';

  const resolvedKey =
    fileKey || (fileUrl ? fileUrl.substring(fileUrl.lastIndexOf('/') + 1) : '');

  if (!resolvedKey) {
    throw createError({
      statusCode: 400,
      message: 'Informe fileKey ou fileUrl para remover o arquivo.',
    });
  }

  try {
    const response = await utapi.deleteFiles(resolvedKey);
    return response;
  } catch (error) {
    console.error('Error during file delete -> ', error);
    throw createError({
      statusCode: 500,
      message: 'Error during delete file - server',
    });
  }
});
