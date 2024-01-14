import { create } from 'zustand';
import useTemplatesApi from './useTemplateApi';
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


// インターフェース定義
interface TemplateState {
    templateList: GetTemplatesByUserResponse;
    getTemplateList: () => Promise<GetTemplatesByUserResponse>;
    readmoreTemplateList: (LastEvaluatedKey: string) => Promise<GetTemplatesByUserResponse>;
    setTemplateList: (data: GetTemplatesByUserResponse) => void;
    loading: boolean;
    setLoading: (newLoading: boolean) => void;
    createTemplateAndReload: (request: CreateTemplateRequest) => Promise<CreateTemplateResponse>;
    updateTemplateAndReload: (request: UpdateTemplateRequest) => Promise<UpdateTemplateResponse>;
    deleteTemplateAndReload: (request: DeleteTemplateRequest) => Promise<DeleteTemplateResponse>;
    tagList: GetTagsResponse;
    getTagList: () => Promise<GetTagsResponse>;
    readmoreTagList: (LastEvaluatedKey: string) => Promise<GetTagsResponse>;
    setTagList: (data: GetTagsResponse) => void;
    getTagDetail: (tagid: string) => Promise<GetTagDetailResponse>;
    getTemplatesByTag: (request: GetTemplatesByTagRequest) => Promise<GetTemplatesByTagResponse>;
    readmoreTemplatesByTag: (request: GetTemplatesByTagRequest) => Promise<GetTemplatesByTagResponse>;
    getTemplateDetail: (templateid: string) => Promise<GetTemplateDetailResponse>;
    incrementTemplateCopycount: (templateid: string) => Promise<IncrementTemplateCopycountResponse>;
}

// zustand を使ったステート定義
const useTemplateStore = create<TemplateState>()((set) => {
    // ステートの準備部分
    const api = useTemplatesApi();

    // templateList の初期化
    let templateList: GetTemplatesByUserResponse = {
        items: [],
        LastEvaluatedKey: {} 
    };

    // TemplateList の取得
    const getTemplateList = async () => {
        const result: Awaited<GetTemplatesByUserResponse> = await api.getTemplatesMy();
        return result
    }

    // TemplateList を上書き
    const setTemplateList = (data: GetTemplatesByUserResponse) => {
        set(() => ({
            templateList: data
        }));
    }

    // Read More ボタンを押したとき、データを追加で読みこむ
    const readmoreTemplateList = async (lastEvaluatedKey: string) => {
        const result: Awaited<GetTemplatesByUserResponse> = await api.readmoreTemplatesMy(lastEvaluatedKey);
        return result;
    }

    // Loading 状態を設定
    const setLoading = (newLoading: boolean) => {
        set(() => ({
            loading: newLoading,
        }));
    };

    // Template の新規作成して、TemplateList を再度読み込む
    const createTemplateAndReload = async (request: CreateTemplateRequest) => {
        const response: Awaited<CreateTemplateResponse> = await api.createTemplate(request);
        setLoading(true);
        const reloadTemplateList = await getTemplateList();
        setTemplateList(reloadTemplateList);
        setLoading(false);
        return response;
    }

    // Template を編集して、TemplateList を再度読み込む
    const updateTemplateAndReload = async (request: UpdateTemplateRequest) => {
        const response: Awaited<UpdateTemplateResponse> = await api.updateTemplate(request);
        setLoading(true);
        const reloadTemplateList = await getTemplateList();
        setTemplateList(reloadTemplateList);
        setLoading(false);
        return response;
    }

    // Template を削除して、TemplateList を再度読み込む
    const deleteTemplateAndReload = async (request: DeleteTemplateRequest) => {
        const response: Awaited<DeleteTemplateResponse> = await api.deleteTemplate(request);
        setLoading(true);
        const reloadTemplateList = await getTemplateList();
        setTemplateList(reloadTemplateList);
        setLoading(false);
        return response;
    }

    // tagList の初期化
    let tagList: GetTagsResponse = {
        items: [],
        LastEvaluatedKey: {}
    };

    // tagList の取得
    const getTagList = async () => {
        const result: Awaited<GetTagsResponse> = await api.getTags();
        return result
    }

    // tagList を上書き
    const setTagList = (data: GetTagsResponse) => {
        set(() => ({
            tagList: data
        }));
    }

    // Read More ボタンを押したとき、データを追加で読みこむ
    const readmoreTagList = async (lastEvaluatedKey: string) => {
        console.log(lastEvaluatedKey);
        const result: Awaited<GetTagsResponse> = await api.readmoreTags(lastEvaluatedKey);
        return result;
    }

    // tagid から tag の詳細を取得
    const getTagDetail = async (tagid: string) => {
        const result: Awaited<GetTagDetailResponse> = await api.getTagDetail(tagid);
        return result;
    }

    // tagid から、紐づくテンプレートを取得
    const getTemplatesByTag = async (request: GetTemplatesByTagRequest) => {
        const result: Awaited<GetTemplatesByTagResponse> = await api.getTemplatesByTag(request);
        return result;
    }

    // tagid から、紐づくテンプレートを取得
    const readmoreTemplatesByTag = async (request: GetTemplatesByTagRequest) => {
        const result: Awaited<GetTemplatesByTagResponse> = await api.readmoreTemplatesByTag(request);
        return result;
    }

    // templateid から Template の詳細を取得
    const getTemplateDetail = async (templateid: string) => {
        const result: Awaited<GetTemplateDetailResponse> = await api.getTemplateDetail(templateid);
        return result;
    }

    // Template の Copycount をカウントアップする
    const incrementTemplateCopycount = async (templateid: string) => {
        const result: Awaited<IncrementTemplateCopycountResponse> = await api.incrementTemplateCopycount(templateid);
        return result;
    }


    // 実際のステートの定義部分
    return {
        templateList: templateList,
        readmoreTemplateList: readmoreTemplateList,
        getTemplateList: getTemplateList,
        setTemplateList: setTemplateList,
        loading: false,
        setLoading: setLoading,
        createTemplateAndReload: createTemplateAndReload,
        updateTemplateAndReload: updateTemplateAndReload,
        deleteTemplateAndReload: deleteTemplateAndReload,
        tagList: tagList,
        setTagList: setTagList,
        getTagList: getTagList,
        readmoreTagList: readmoreTagList,
        getTagDetail: getTagDetail,
        getTemplatesByTag: getTemplatesByTag,
        readmoreTemplatesByTag: readmoreTemplatesByTag,
        getTemplateDetail: getTemplateDetail,
        incrementTemplateCopycount: incrementTemplateCopycount,
    }
})

export default useTemplateStore;





// 初期の画面表示時に Rest API を実行できたもの

// const useTemplates = () => {

//     // useTemplatesApi から、getTemplatesMy 関数の定義を持ってくる
//     const { getTemplatesMy } = useTemplatesApi();

//     // useTemplatesApi を実行して変数 templateList に格納
//     const templateList = getTemplatesMy();


//     return {
//         templateList,
//         getTemplatesMy2 : async () => {
//             const test = getTemplatesMy()
//             console.log("test")
//         },
//     }
// }












// state 1st 段階

// // 型の指定
// interface State {
//     count: number;
//     increase: () => void;
//     decrease: () => void;
//     templateList: GetTemplatesByUserResponse;
// }

// // zustand を利用したステート管理
// const useStore = create<State>((set, get) => {
//     const {
//         getTemplatesMy
//     } = useTemplatesApi();


//     // const templateList = getTemplatesMy();

//     return {
//         count: 0,
//         increase: () => set((state) => ({ count: state.count + 1 })),
//         decrease: () => set((state) => ({ count: state.count - 1 })),
//         templateList: get().templateList,
//     };
// });

// const useTemplates = () => {
//     // ステートから持ってくる
//     const {
//         count,
//         increase,
//         decrease,
//         templateList,
//     } = useStore();

//     // ステートから持ってきたデータを return する (関数もできる？)
//     return {
//         count,
//         increase,
//         decrease,
//         templateList
//     };
// }

// export default useTemplates;






// State 2 段階目
// インターフェース定義
// interface BearState {
//     bears: number
//     increase: (by: number) => void
//     testfunc: () => Promise<void>;
//     templateList: string;
// }

// // ステート定義
// const useBearStore = create<BearState>()((set) => {
//     // ステートの準備部分
//     const api = useTemplatesApi();

//     const testfunc = async () => {
//         const templateList = api.getTemplatesMy();
//         const templateListString = JSON.stringify(templateList)
//         set(() => ({
//             templateList: templateListString,
//         }));
//     }

//     // 実際のステートの定義部分
//     return {
//         bears: 0,
//         increase: (by) => set((state) => ({ bears: state.bears + by })),
//         testfunc,
//         templateList: '',
//     }
// })

// // export のもの
// const useTemplates = () => {
//     // ステートから持ってくる
//     const {
//         bears,
//         increase,
//         testfunc,
//         templateList,
//     } = useBearStore();

//     // ステートから持ってきたデータを return する (関数もできる？)
//     return {
//         bears,
//         increase,
//         testfunc,
//         templateList,
//     };
// }

// export default useBearStore;






// 良い感じに動作したもの

// const useTemplate = () => {
//     const { getTemplatesMy } = useTemplatesApi();

//     return {
//         myFunc: async () => {
//             getTemplatesMy();
//         }
//     }
// }

// export default useTemplate;










// zustand 利用時にある程度良い感じのもの。謎の Auth Error
// import useTemplatesApi from './useTemplateApi';
// import { create } from 'zustand';
// import {
//     GetTemplatesByUserResponse,
// } from 'generative-ai-use-cases-jp';

// // インターフェース定義
// interface TemplateState {
//     templateList: Promise<GetTemplatesByUserResponse>;
//     testFunc: () => void;
//     // readmoreTemplateList: () => void;
// }

// // // ステート定義
// const useTemplateStore = create<TemplateState>()((set) => {
//     // ステートの準備部分
//     const api = useTemplatesApi();
//     const templateList = api.getTemplatesMy();

//     // const readmoreTemplateList = () => {
//     // }

//     const testFunc = () => {
//         const test = api.getTemplatesMy();
//         console.log(test)
//     }

//     // 実際のステートの定義部分
//     return {
//         templateList: templateList,
//         testFunc: testFunc,
//     }
// })

// export default useTemplateStore;















// State を利用していて、動作しているコード
// import useTemplatesApi from './useTemplateApi';
// import {
//     GetTemplatesByUserResponse,
// } from 'generative-ai-use-cases-jp';


// const useTemplates = () => {

//     // useTemplatesApi から、getTemplatesMy 関数の定義を持ってくる
//     const {
//         getTemplatesMy,
//         readmoreTemplatesMy,
//     } = useTemplatesApi();

//     const getTemplateList = async () => {
//         const result: Awaited<GetTemplatesByUserResponse> = await getTemplatesMy();
//         return result
//     }

//     const readmoreTemplateList = async (lastEvaluatedKey: string) => {
//         const result: Awaited<GetTemplatesByUserResponse> = await readmoreTemplatesMy(lastEvaluatedKey);
//         return result
//     }

//     return {
//         getTemplateList,
//         readmoreTemplateList,
//     }
// }

// export default useTemplates;