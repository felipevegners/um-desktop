import { UTApi } from 'uploadthing/server';

const utapi = new UTApi({
    token: process.env.NUXT_UPLOADTHING_TOKEN,
});

export default defineEventHandler(async (event) => {
    const fileUrl = await readBody(event);
    console.log('File URL -> ', fileUrl);
    try {
        return await utapi.deleteFiles(fileUrl);
    } catch (error) {
        console.log('Error during file delete -> ', error);
    }
});
