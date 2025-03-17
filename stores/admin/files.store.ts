import { defineStore } from 'pinia';

// import { deleteFilesService } from '~/server/services/admin/files';

interface IFiles {
    files: any;
    loadingFileData: boolean;
}

export const useFilesStore = defineStore('files', {
    state: (): IFiles => {
        return {
            files: [],
            loadingFileData: false,
        };
    },
    actions: {
        async deleteFileAction(fileUrl: string) {
            console.log('Deleting file -> ', fileUrl);
            this.loadingFileData = true;
            try {
                // await deleteFilesService(fileUrl);
            } catch (error) {
                console.log('Error during file delete -> ', error);
            } finally {
                this.loadingFileData = false;
            }
        },
    },
});
