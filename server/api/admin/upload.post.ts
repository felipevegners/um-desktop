import { put } from '@vercel/blob';

export default defineEventHandler(async (event) => {
    const payload = await readBody(event);
    const { name } = payload;
    console.log('name --> ', name);

    const blob = await put('foto_felipe.jpg', payload, {
        access: 'public',
    });

    console.log('Blob --> ', blob);
});
