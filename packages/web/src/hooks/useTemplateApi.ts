import {
    GetTemplatesByUserResponse,
    CreateTemplateResponse,
    CreateTemplateRequest,
    UpdateTemplateRequest,
    UpdateTemplateResponse,
    DeleteTemplateRequest,
    DeleteTemplateResponse,
} from 'generative-ai-use-cases-jp';
import useHttp from './useHttp';

const useTemplatesApi = () => {
    const http = useHttp();
    return {
        getTemplatesMy: async (): Promise<GetTemplatesByUserResponse> => {
            const response = await http.getWithPromise('/templates/my');
            return response.data;
        },
        readmoreTemplatesMy: async (lastEvaluatedKey?: string): Promise<GetTemplatesByUserResponse> => {
            const response = await http.getWithPromise('/templates/my?lastEvaluatedKey=' + lastEvaluatedKey);
            return response.data;
        },
        createTemplate: async (request: CreateTemplateRequest): Promise<CreateTemplateResponse> => {
            const res = await http.post<CreateTemplateResponse, CreateTemplateRequest>('/templates/create', request);
            return res.data;
        },
        updateTemplate: async (request: UpdateTemplateRequest): Promise<UpdateTemplateResponse> => {
            const res = await http.put<UpdateTemplateResponse, UpdateTemplateRequest>('/templates/' + request.templateid, request);
            return res.data;
        },
        deleteTemplate: async (request: DeleteTemplateRequest): Promise<DeleteTemplateResponse> => {
            const res = await http.delete<DeleteTemplateResponse, DeleteTemplateRequest>('/templates/' + request.id);
            return res.data;
        },
    };
};

export default useTemplatesApi;