import { error } from '@sveltejs/kit';

export const actions = {
    analyze: async ({ request }) => {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return error(400, 'No file uploaded');
        }
        const fileName = file.name;
        const fileType = file.type;
        const fileSize = file.size;

        console.log('File info:', fileName, fileType, fileSize);

        // Perform analysis on the uploaded file
        // For example, you can use a library like 'file-type' to determine the file type
        // and perform further analysis based on that.

        return {
            success: true,
            message: 'File analyzed successfully',
            data: {
                name: fileName,
                type: fileType,
                size: fileSize,
            },
        };
    },
}
