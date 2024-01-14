import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import useTemplateMy from '../hooks/useTemplateMy';
import Button from '../components/Button';
import {
    GetTagsResponse,
} from 'generative-ai-use-cases-jp';


const TemplatesTagSelect: React.FC = () => {
    // useTemplate で定義した API を取り出す
    const {
        tagList,
        getTagList,
        readmoreTagList,
        setTagList,
        setLoading,
        loading,
    } = useTemplateMy();

    // readMore ボタンを押したかどうかを管理する State
    const [readmoreLoading, setReadmoreLoading] = useState(false);

    // 画面表示時に、タグ一覧を取得して、State に格納する
    useEffect(() => {
        (async () => {
            setLoading(true);
            const response = await getTagList();
            setTagList(response);
            setLoading(false);
        })()
    }, []);

    // ReadMore ボタンが押されたときに、再度、データを取得する処理
    const readMore = async () => {
        if (tagList?.LastEvaluatedKey) { // LastEvaluatedKey は基本的に存在するはずだが、念のため if で確認を入れる
            setReadmoreLoading(true);
            const encodedLastEvaluatedKey = btoa(encodeURIComponent(JSON.stringify(tagList.LastEvaluatedKey))); // 日本語が含まれており、encodeURIComponent を行ったあと base64 でエンコードする

            const response = await readmoreTagList(encodedLastEvaluatedKey); // LastEvaluatedKey は JSON 形式になっており、base64 に encode した内容を URL Parameter に入れる
            setReadmoreLoading(false);

            // 既存の templateList に、Read More ボタンを押して新たに取得したデータを追加する
            if (response?.items) {
                const readmoreList: GetTagsResponse = response;
                readmoreList.items = [...tagList.items, ...readmoreList.items]
                setTagList(readmoreList);
            }
        }
    };

    const navigate = useNavigate();
    const handleCardClick = (tagId : string) => {
        navigate(`/templates/tags/${tagId}`);
    };

    return (
        <div>
            {loading ? (
                <div className="col-span-5 my-36 flex items-center justify-center text-xl font-semibold">
                    <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent "></div>
                </div>
            ) : (
                <>
                    <div className="invisible col-span-5 my-2 flex h-0 items-center justify-center text-xl font-semibold print:visible print:my-5 print:h-min lg:mb-14 lg:visible lg:my-5 lg:h-min">
                        タグから探す
                    </div>
                    <div className="grid gap-5 mx-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:mx-32">
                        {Object.entries(tagList.items).map(([index, item]) => (
                            <Card key={index} className="flex hover:cursor-pointer hover:bg-gray-200" label="" onClick={() => handleCardClick(item.tagid)}>
                                <div className="font-medium grow text-lg">
                                    {item.tagname}
                                </div>
                                <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-sm font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                    {item.gsi_sk} 件
                                </span>
                            </Card>
                        ))}
                    </div>
                    <div className="flex justify-center my-5">
                        {
                            tagList?.LastEvaluatedKey && (
                                <Button className="w-28 h-11 gap-3" onClick={readMore}>
                                    {
                                        readmoreLoading ? (
                                            <div className="h-5 w-5 animate-spin rounded-full border-4 border-t-transparent"></div>
                                        ) : (
                                            "Read More"
                                        )
                                    }
                                </Button>
                            )
                        }
                    </div>
                </>
            )}
        </div>
    )
}

export default TemplatesTagSelect;