import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
    Template,
} from 'generative-ai-use-cases-jp';
import useTemplateMy from '../hooks/useTemplateMy';
import { renderWithLineBreaks } from '../utils/TemplateUtils';
import ButtonCopyWithTemplateCopycountup from '../components/ButtonCopyWithTemplateCopycountup';
import Button from '../components/Button';

const TemplateDetail: React.FC = () => {
    // URL からテンプレート id を取得する
    const params = useParams<{ templateid: string }>();
    const navigate = useNavigate();

    // useTemplate で定義した API を取り出す
    const {
        getTemplateDetail,
    } = useTemplateMy();

    const location = useLocation();
    const [template, setTemplate] = useState<Template>(location.state || {
        templateid: "",
        id: "",
        title: "",
        prompt: "",
        public: false,
        usermailaddress: "",
        tags: {},
        createdDate: "",
        copycount: 0, // Assuming 'copycount' should be a number, not a string
    });

    useEffect(() => {
        (async () => {
            // location.state が存在しない場合に API からテンプレートの詳細を取得
            if (template.templateid === "" && params.templateid) {
                const templateDetail = await getTemplateDetail(params.templateid);
                setTemplate(templateDetail);
            }
        })();
    }, [params.templateid]);


    // 指定した tag id の詳細ページに移動する関数
    const navigateToTemplateByTag = (tagid: string) => {
        navigate(`/templates/tags/${tagid}`);
    };

    console.log(template);

    return (
        <>
            <div className="mt-5 mb-10 flex items-center justify-center text-xl font-semibold">
                テンプレート詳細 : {template?.title}
            </div>
            <div className="grid items-center grid-cols-5">
                <hr className="mx-3 col-start-1 col-end-6 sm:col-start-2 sm:col-end-5 border-gray-400"></hr>
                <p className="mx-3 my-10 col-start-1 col-end-2 sm:col-start-2 sm:col-end-3">プロンプト</p>
                <div className="my-10 col-start-2 col-end-5 sm:col-start-3 sm:col-end-5 flex flex-col">
                    <p className="mt-10 mb-5 col-start-2 col-end-5 sm:col-start-3 sm:col-end-5">{renderWithLineBreaks(template?.prompt)}</p>
                    <div className="flex">
                        <ButtonCopyWithTemplateCopycountup text={template.prompt} templateid={template.templateid} />
                        <span className="mt-1 text-sm">コピー</span>
                    </div>
                </div>
                <hr className="mx-3 col-start-1 col-end-6 sm:col-start-2 sm:col-end-5 border-gray-300"></hr>
                <p className="mx-3 my-10 col-start-1 col-end-2 sm:col-start-2 sm:col-end-3">作成者</p>
                <p className="my-10 col-start-2 col-end-5 sm:col-start-3 sm:col-end-5 flex">{template?.usermailaddress}</p>
                <hr className="mx-3 col-start-1 col-end-6 sm:col-start-2 sm:col-end-5 border-gray-300"></hr>
                <p className="mx-3 my-10 col-start-1 col-end-2 sm:col-start-2 sm:col-end-3">タグ</p>
                <div className="my-10 col-start-2 col-end-5 sm:col-start-3 sm:col-end-5 flex">
                    {
                        Object.keys(template?.tags || {}).length > 0 ? (
                            Object.entries(template.tags).map(([key, value], index) => (
                                <span
                                    key={index}
                                    className="text-sm mr-1 p-1 bg-gray-200 rounded cursor-pointer hover:bg-gray-300"
                                    onClick={() => navigateToTemplateByTag(key)}
                                >
                                    {value}
                                </span>
                            ))
                        ) : (
                            <span className="text-sm p-1 rounded">タグ無し</span>
                        )
                    }
                </div>
                <hr className="mx-3 mb-12 col-start-1 col-end-6 sm:col-start-2 sm:col-end-5 border-gray-300"></hr>
                <Button outlined
                    onClick={() => window.history.back()}
                    className="col-start-4 justify-self-center mb-10"
                >
                    戻る
                </Button>
            </div>

        </>
    );
}

export default TemplateDetail;