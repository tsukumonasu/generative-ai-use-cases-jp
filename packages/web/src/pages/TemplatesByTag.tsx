import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useTemplateMy from '../hooks/useTemplateMy';
import Card from '../components/Card';
import {
    GetTemplatesByTagRequest,
    GetTemplatesByTagResponse,
    Template,
} from 'generative-ai-use-cases-jp';
import { renderWithLineBreaks, truncateText } from '../utils/TemplateUtils';
import Button from '../components/Button';
import ButtonCopyWithTemplateCopycountup from '../components/ButtonCopyWithTemplateCopycountup';
import {
    PiDotsThreeCircle
} from 'react-icons/pi';

const TemplatesByTag: React.FC = () => {
    const params = useParams<{ tagid: string }>();
    const navigate = useNavigate();

    // useTemplate で定義した API を取り出す
    const {
        getTagDetail,
        getTemplatesByTag,
        setLoading,
        loading,
        readmoreTemplatesByTag,
    } = useTemplateMy();


    // タグを管理するステート
    const [tagname, setTagname] = React.useState<string>('');

    // テンプレート一覧 (人気順) を管理するステート
    const [templateListByTagSortCopycount, setTemplateListByTagSortCopycount] = useState<GetTemplatesByTagResponse>({ items: [] });

    // テンプレート一覧 (日付順) を管理するステート
    const [templateListByCreatedDate, setTemplateListByCreatedDate] = useState<GetTemplatesByTagResponse>({ items: [], LastEvaluatedKey: {}});

    const [readmoreLoading, setReadmoreLoading] = useState(false);

    // 画面表示時に、「タグの名前」「人気のテンプレート」「日付順のテンプレート」を取得する
    useEffect(() => {
        (async () => {
            if (params.tagid) {
                setLoading(true);

                // CopyCount が多いテンプレートを取得する用のリクエスト
                const requestTemplateCopycount: GetTemplatesByTagRequest = {
                    tagid: params.tagid,
                    sortBy: 'copycount',
                };

                // CopyCount が多いテンプレートを取得する用のリクエスト
                const requestTemplateCreatedDate: GetTemplatesByTagRequest = {
                    tagid: params.tagid,
                    sortBy: 'createdDate',
                };

                const [tagDetailResponse, templateListCopycountResponse, templateListCreatedDateResponse] = await Promise.all([
                    getTagDetail(params.tagid), // tagid から tag 名の取得
                    getTemplatesByTag(requestTemplateCopycount), // Copycount の大きい Top 3 のテンプレートを取得
                    getTemplatesByTag(requestTemplateCreatedDate), // 作成日時の降順でテンプレートを取得
                ]);

                // 結果をセット
                setTagname(tagDetailResponse.tagname);
                setTemplateListByTagSortCopycount(templateListCopycountResponse);
                setTemplateListByCreatedDate(templateListCreatedDateResponse);

                setLoading(false);
            }
        })()
    }, [params.tagid]);

    // ReadMore ボタンが押されたときに、再度、TemplateListByCreatedData の追加データを取得する処理
    const readMore = async () => {
        if (templateListByCreatedDate.LastEvaluatedKey) { // LastEvaluatedKey は基本的に存在するはずだが、念のため if で確認を入れる
            setReadmoreLoading(true);

            const readmoreRequest: GetTemplatesByTagRequest = {
                tagid: params.tagid as string,
                sortBy: 'createdDate',
                LastEvaluatedKey: btoa(JSON.stringify(templateListByCreatedDate.LastEvaluatedKey))
            }

            const response = await readmoreTemplatesByTag(readmoreRequest); // LastEvaluatedKey は JSON 形式になっており、base64 に encode した内容を URL Parameter に入れる
            setReadmoreLoading(false);

            // 既存の templateList に、Read More ボタンを押して新たに取得したデータを追加する
            if (response?.items) {
                const readmoreList: GetTemplatesByTagResponse = response;
                readmoreList.items = [...templateListByCreatedDate.items, ...readmoreList.items]
                setTemplateListByCreatedDate(readmoreList);
            }
        }
    };

    // 指定した template id の詳細ページに移動する関数
    const navigateToTemplateDetail = (template: Template) => {
        navigate(`/templates/${template.templateid}`, {state: template});
    };

    return (
        <div className="grid grid-cols-5 gap-4 pb-12">
            {loading ? (
                <div className="col-span-5 my-36 flex items-center justify-center text-xl font-semibold">
                    <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent "></div>
                </div>
            ) : (
                <>
                    <div className="invisible col-span-5 my-2 flex h-0 items-center justify-center text-xl font-semibold print:visible print:my-5 print:h-min lg:visible lg:my-5 lg:h-min">
                        タグ : {tagname}
                    </div>
                    <div className="text-lg font-semibold col-start-1 lg:col-start-2 ml-2 col-span-full">
                        人気のテンプレート (Top3)
                    </div>
                    {templateListByTagSortCopycount.items.length > 0 ? (
                        templateListByTagSortCopycount.items.map((template, index) => (
                            <React.Fragment key={index}>
                                <Card className="relative gap-3 col-start-1 lg:col-start-2 col-end-6 lg:col-end-5 ml-2 mr-2 justify-end" label={template.title}>
                                    <div className="absolute top-0 right-0 flex items-center p-4">
                                        <ButtonCopyWithTemplateCopycountup text={template.prompt} templateid={template.templateid} />
                                        <span className="text-sm font-medium">プロンプトコピー</span>
                                        <div onClick={() => navigateToTemplateDetail(template)} style={{ cursor: 'pointer' }}>
                                            <PiDotsThreeCircle className="h-6 w-6 ml-6" />
                                        </div>
                                        <span className="text-sm font-medium ml-1">詳細</span>
                                    </div>
                                    {renderWithLineBreaks(truncateText(template.prompt))}
                                </Card>
                            </React.Fragment>
                        ))
                    ) : (
                        <div className="col-span-full text-center">テンプレート無し</div>
                    )}
                    <div className="text-lg font-semibold col-start-1 lg:col-start-2 ml-2 col-span-full mt-28">
                        テンプレート一覧 (最新日時順)
                    </div>
                    {templateListByCreatedDate.items.length > 0 ? (
                        templateListByCreatedDate.items.map((template, index) => (
                            <Card className="relative gap-3 col-start-1 lg:col-start-2 col-end-6 lg:col-end-5 ml-2 mr-2 justify-end" key={index} label={template.title}>
                                <div className="absolute top-0 right-0 flex items-center p-4">
                                    <ButtonCopyWithTemplateCopycountup text={template.prompt} templateid={template.templateid} />
                                    <span className="text-sm font-medium">プロンプトコピー</span>
                                    <div onClick={() => navigateToTemplateDetail(template)} style={{ cursor: 'pointer' }}>
                                        <PiDotsThreeCircle className="h-6 w-6 ml-6" />
                                    </div>
                                    <span className="text-sm font-medium ml-1">詳細</span>
                                </div>
                                {renderWithLineBreaks(truncateText(template.prompt))}
                            </Card>
                        ))
                    ) : (
                        <div className="col-span-full text-center">テンプレート無し</div>
                    )}
                    {
                        templateListByCreatedDate?.LastEvaluatedKey && (
                            <Button className="shrink w-28 h-11 gap-3 col-start-3 justify-self-center" onClick={readMore}>
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
                </>
            )}
        </div>
    );
};

export default TemplatesByTag;