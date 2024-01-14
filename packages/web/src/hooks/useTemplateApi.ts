import {
    GetTemplatesByUserResponse,
    CreateTemplateResponse,
    CreateTemplateRequest,
    UpdateTemplateRequest,
    UpdateTemplateResponse,
    DeleteTemplateRequest,
    DeleteTemplateResponse,
    GetTagsResponse,
    GetTagDetailResponse,
    GetTemplatesByTagRequest,
    GetTemplatesByTagResponse,
    GetTemplateDetailResponse,
    IncrementTemplateCopycountResponse,
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
        incrementTemplateCopycount: async (templateid: string): Promise<IncrementTemplateCopycountResponse> => {
            const res = await http.post<IncrementTemplateCopycountResponse>('/templates/' + templateid + '/increment-copycount', templateid);
            return res.data;
        },
        getTags: async (): Promise<GetTagsResponse> => {
            const response = await http.getWithPromise('/templates/tags');
            return response.data;
        },
        readmoreTags: async (lastEvaluatedKey?: string): Promise<GetTagsResponse> => {
            const response = await http.getWithPromise('/templates/tags?lastEvaluatedKey=' + lastEvaluatedKey);
            return response.data;
        },
        getTagDetail: async (tagid: string): Promise<GetTagDetailResponse> => {
            const response = await http.getWithPromise('/templates/tags/' + tagid);
            return response.data;
        },
        getTemplatesByTag: async (request: GetTemplatesByTagRequest): Promise<GetTemplatesByTagResponse> => {
            const response = await http.getWithPromise('/templates?tag=' + request.tagid + '&sortby=' + request.sortBy);
            return response.data;
        },
        readmoreTemplatesByTag: async (request: GetTemplatesByTagRequest): Promise<GetTemplatesByTagResponse> => {
            const response = await http.getWithPromise('/templates?tag=' + request.tagid + '&sortby=' + request.sortBy + '&lastEvaluatedKey=' + request.LastEvaluatedKey);
            return response.data;
        },
        getTemplateDetail: async (templateid: string): Promise<GetTemplateDetailResponse> => {
            const response = await http.getWithPromise('/templates/' + templateid);
            return response.data;
        },
    };
};

export default useTemplatesApi;