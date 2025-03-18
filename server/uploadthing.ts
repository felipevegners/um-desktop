import type { H3Event } from 'h3';
import { createUploadthing } from 'uploadthing/h3';
import type { FileRouter } from 'uploadthing/h3';

// Fake auth function

const f = createUploadthing();

const auth = (ev: H3Event) => ({ id: 'fakeId' }); // Fake auth function

// FileRouter for your app, can contain multiple FileRoutes
export const uploadRouter = {
    // Define as many FileRoutes as you like, each with a unique routeSlug
    driverFiles: f({
        image: { maxFileSize: '4MB', maxFileCount: 5 },
        pdf: { maxFileSize: '4MB', maxFileCount: 5 },
    })
        // Set permissions and file types for this FileRoute
        .middleware(async ({ event }) => {
            // This code runs on your server before upload
            const user = await auth(event);

            // If you throw, the user will not be able to upload
            if (!user) throw new Error('Unauthorized');

            // Whatever is returned here is accessible in onUploadComplete as `metadata`
            return { userId: user.id };
        })
        .onUploadComplete((data) => console.log('file uploaded -> ', data)),

    driverCarFiles: f({
        image: { maxFileSize: '4MB', maxFileCount: 10 },
        pdf: { maxFileSize: '4MB', maxFileCount: 10 },
    })
        .middleware(async ({ event }) => {
            const user = await auth(event);
            if (!user) throw new Error('Unauthorized');
            return { userId: user.id };
        })
        .onUploadComplete((data) => console.log('file uploaded -> ', data)),

    customerLogo: f({
        image: { maxFileSize: '4MB', maxFileCount: 1 },
    })
        .middleware(async ({ event }) => {
            const user = await auth(event);
            if (!user) throw new Error('Unauthorized');
            return { userId: user.id };
        })
        .onUploadComplete((data) => console.log('file uploaded -> ', data)),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
