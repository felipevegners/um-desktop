import { UTApi } from 'uploadthing/server';

const utapi = new UTApi({
    token: process.env.NUXT_UPLOADTHING_TOKEN,
});

export default defineEventHandler(async (event) => {
    const data = await readBody(event);
    const newUrl = data.fileUrl.substring(data.fileUrl.lastIndexOf('/') + 1);
    try {
        const response = await utapi.deleteFiles(newUrl);
        return response;
    } catch (error) {
        console.error('Error during file delete -> ', error);
        throw new Error('Error during delete file - server');
    }
});
