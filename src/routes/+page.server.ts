import { error } from '@sveltejs/kit';
import {
    GoogleGenAI,
    createUserContent,
    createPartFromUri,
} from "@google/genai";

export const actions = {
    analyze: async ({ request, platform }) => {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return error(400, 'No file uploaded');
        }
        // const fileName = file.name;
        // const fileType = file.type;
        // const fileSize = file.size;
        // console.log('File info:', fileName, fileType, fileSize, platform?.env.GOOGLE_AI_STUDIO_API_TOKEN);

        const result = await rankImage(file, platform?.env.GOOGLE_AI_STUDIO_API_TOKEN!);

        return {
            success: true,
            message: 'File analyzed successfully',
            result: result,
        };
    },
}

async function rankImage(file: File, apiKey: string) {
    const ai = new GoogleGenAI({ apiKey });

    const myfile = await ai.files.upload({
        file: file,
        config: { mimeType: file.type },
    });
    if (!myfile || !myfile.uri || !myfile.mimeType) {
        throw error(500, 'Failed to upload file');
    }

    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: createUserContent([
            createPartFromUri(myfile.uri, myfile.mimeType),
            "你是一个精通中国男人审美标准的AI助手 ，你很擅长识别人物图片并且对颜值进行评分。如果用户上传的图片是人物照片，则请给出评分，范围是1-10分，1分表示非常丑，10分表示非常美。请给出评分和理由。如果用户上传的图片不是人物照片，请告诉我这不是人物照片。",
        ]),
    });
    // console.log(response.text);
    return response.text;
}
