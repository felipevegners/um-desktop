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
            this.loadingFileData = true;
            try {
                const response = await $fetch('/api/admin/files', {
                    method: 'DELETE',
                    body: { fileUrl },
                });
                if (response.success) {
                    this.loadingFileData = false;
                }
                console.log('Response from STORE -> ', response);
            } catch (error) {
                return error;
            }
        },
    },
});
