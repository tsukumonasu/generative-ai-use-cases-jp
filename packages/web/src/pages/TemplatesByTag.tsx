import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useTemplateMy from '../hooks/useTemplateMy';


import {
    // GetTagsResponse,
    // GetTagDetailResponse,
    GetTemplatesByTagRequest,
    GetTemplatesByTagResponse,
} from 'generative-ai-use-cases-jp';

const TemplatesByTag: React.FC = () => {
    const params = useParams<{ tagid: string }>();

    // useTemplate で定義した API を取り出す
    const {
        getTagDetail,
        getTemplatesByTag,
        // templateListByTagSortCopycount,
        setTemplateListByTagSortCopycount,
        setLoading,
        loading,
        tagname,
        setTagname,
    } = useTemplateMy();


    // 画面表示時に、「タグの名前」「人気のテンプレート」「日付順のテンプレート」を取得する
    useEffect(() => {
        (async () => {
            if (params.tagid) {
                setLoading(true);

                // tagid から tag 名の取得
                const response = await getTagDetail(params.tagid);
                setTagname(response.tagname);

                // tagid から、CopyCount の大きい Top 3 のテンプレートを取得
                const request : GetTemplatesByTagRequest = {
                    tagid: params.tagid,
                    sortBy: 'copycount',
                }

                const templateListCopycount: GetTemplatesByTagResponse = await getTemplatesByTag(request);
                setTemplateListByTagSortCopycount(templateListCopycount);

                setLoading(false);
            }
        })()
    }, [params.tagid]);

    return (
        <div className="grid grid-cols-5 gap-4 pb-12">
            {loading ? (
                <div className="col-span-5 my-36 flex items-center justify-center text-xl font-semibold">
                    <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent "></div>
                </div>
            ) : (
                <div className="invisible col-span-5 my-2 flex h-0 items-center justify-center text-xl font-semibold print:visible print:my-5 print:h-min lg:visible lg:my-5 lg:h-min">
                    タグ : {tagname}
                </div>
            )}
        </div>
    );
};

export default TemplatesByTag;