import type { H3Event } from 'h3';
import { createUploadthing } from 'uploadthing/h3';
import type { FileRouter } from 'uploadthing/h3';

const f = createUploadthing();

const auth = (ev: H3Event) => ({ id: 'fakeId' }); // Fake auth function

// FileRouter for your app, can contain multiple FileRoutes
export const uploadRouter = {
    // Define as many FileRoutes as you like, each with a unique routeSlug
    driverFiles: f(['image', 'pdf'])
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
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
