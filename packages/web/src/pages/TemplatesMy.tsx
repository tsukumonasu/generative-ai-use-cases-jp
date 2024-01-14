import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import ButtonCopyWithTemplateCopycountup from '../components/ButtonCopyWithTemplateCopycountup';
import Card from '../components/Card';
import useTemplateMy from '../hooks/useTemplateMy';
import { renderWithLineBreaks, truncateText } from '../utils/TemplateUtils';
import {
  GetTemplatesByUserResponse,
} from 'generative-ai-use-cases-jp';
import {
  PiPlusCircleBold,
  PiNotePencil,
  PiTrash,
} from 'react-icons/pi';
import ModalWindowsForCreateTemplate, { CreateModalWindowHandle } from './TemplatesCreateModalWindow';
import ModalWindowsForUpdateTemplate, { UpdateModalWindowHandle } from './TemplatesUpdateModalWindow';
import ModalWindowsForDeleteTemplate, { DeleteModalWindowHandle } from './TemplatesDeleteModalWindow';
import { Template as TemplateType } from 'generative-ai-use-cases-jp';

const TemplatesMy: React.FC = () => {
  const navigate = useNavigate();

  // useTemplate で定義した API を取り出す
  const { 
    getTemplateList, 
    readmoreTemplateList,
    templateList,
    setTemplateList,
    loading,
    setLoading,
    createTemplateAndReload,
    updateTemplateAndReload: updateTemplateAndReload,
    deleteTemplateAndReload,
  } = useTemplateMy();

  // 画面表示時に、自分が作成したテンプレートリストを取得して、State に格納する
  useEffect(() => {
    (async () => {
      if (Object.keys(templateList.items).length === 0) { // templateList の長さが 0 以外のときは、既にデータを取得済みなので実行しない
        setLoading(true);
        const response = await getTemplateList();
        setTemplateList(response);
        setLoading(false);

        console.log(response)
      }
    })()
  }, []);

  // ReadMore ボタンが押されたときに、再度、データを取得する処理
  const readMore = async () => {
    if (templateList?.LastEvaluatedKey) { // LastEvaluatedKey は基本的に存在するはずだが、念のため if で確認を入れる
      setLoading(true);
      const response = await readmoreTemplateList(btoa(JSON.stringify(templateList.LastEvaluatedKey))); // LastEvaluatedKey は JSON 形式になっており、base64 に encode した内容を URL Parameter に入れる
      setLoading(false);
      
      // 既存の templateList に、Read More ボタンを押して新たに取得したデータを追加する
      if (response?.items) {
        const readmoreList: GetTemplatesByUserResponse = response;
        readmoreList.items = [...templateList.items, ...readmoreList.items]
        setTemplateList(readmoreList);
      }
    }
  };

  // モーダルウィンドウを開く関数を呼び出すために、呼び出し先の子供の関数を受け取る宣言
  const createModalWindow = useRef<CreateModalWindowHandle>(null);
  const updateModalWindow = useRef<UpdateModalWindowHandle>(null);
  const deleteModalWindow = useRef<DeleteModalWindowHandle>(null);

  // 子供の関数を呼び出す。モーダルウィンドウを開く。
  const callOpenModalWindow = () => {
    createModalWindow.current?.openModalWindow();
  };
  const callUpdateModalWindow = (template: TemplateType) => {
    updateModalWindow.current?.openModalWindow(template);
  };
  const callDeleteModalWindow = (template: TemplateType) => {
    deleteModalWindow.current?.openModalWindow(template);
  };

  // 指定した tag id の詳細ページに移動する関数
  const navigateToTemplateByTag = (tagid: string) => {
    navigate(`/templates/tags/${tagid}`);
  };

  return (
    <div className="grid grid-cols-5 gap-4 pb-12">
      <div className="invisible col-span-5 my-2 flex h-0 items-center justify-center text-xl font-semibold print:visible print:my-5 print:h-min lg:visible lg:my-5 lg:h-min">
        マイテンプレート
      </div>
      <div className="flex h-11 gap-3 col-start-1 col-end-6 lg:col-end-5 mr-2 justify-end">
        <Button onClick={callOpenModalWindow}>
          <PiPlusCircleBold className="h-4 w-4 text-white-600 mr-1" aria-hidden="true" /> 新規作成
        </Button>
      </div>
      <div className="text-lg font-semibold col-start-1 lg:col-start-2 ml-2 col-span-full">
        作成したテンプレート
      </div>
      {
        Object.keys(templateList).length > 0 ? (
          templateList.items.map((template, index) => (
            <Card className="relative gap-3 col-start-1 lg:col-start-2 col-end-6 lg:col-end-5 ml-2 mr-2 justify-end" key={index} label={template.title}>
              <div className="absolute top-0 right-0 flex items-center p-4">
                <ButtonCopyWithTemplateCopycountup text={template.prompt} templateid={template.templateid}/>
                <span className="text-sm font-medium">プロンプトコピー</span>
                <div onClick={() => callUpdateModalWindow(template)} style={{ cursor: 'pointer' }}>
                  <PiNotePencil className="h-6 w-6 ml-6" />
                </div>
                <span className="text-sm font-medium ml-1">編集</span>
                <div onClick={() => callDeleteModalWindow(template)} style={{ cursor: 'pointer' }}>
                  <PiTrash className="h-6 w-6 ml-6" />
                </div>
                <span className="text-sm font-medium ml-1">削除</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                <div className="col-start-1 col-end-6 p-1">
                  {renderWithLineBreaks(truncateText(template.prompt))}
                </div>
                <label className="block text-sm font-medium text-gray-900 mt-5 col-span-full">
                    タグ
                </label>
                <div className="flex col-span-full">
                  {
                    Object.keys(template.tags).length > 0 ? (
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
                <label className="block text-sm font-medium text-gray-900 mt-5 col-span-full">
                  公開設定
                </label>
                <span className="text-sm p-1 rounded">{template.public ? '公開' : '非公開'}</span>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center">テンプレート無し</div>
        )
      }
      {
        templateList?.LastEvaluatedKey && (
          <Button className="shrink w-28 h-11 gap-3 col-start-3 justify-self-center" onClick={readMore}>
            {
              loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-4 border-t-transparent"></div>
              ) : (
                "Read More"
              )
            }
          </Button>
        )
      }
      <ModalWindowsForCreateTemplate // テンプレート新規作成用のモーダルウィンドウ
        ref={createModalWindow} // モーダルウィンドウ側 (子) の関数を、TemplatesMy (親) 側で呼び出すための参照設定
        createTemplateAndReload={createTemplateAndReload} // TemplatesMy (親) 側で持っている関数を、モーダルウィンドウ側 (子) に渡す設定
      />
      <ModalWindowsForUpdateTemplate // テンプレート編集用のモーダルウィンドウ
        ref={updateModalWindow} // モーダルウィンドウ側 (子) の関数を、TemplatesMy (親) 側で呼び出すための参照設定
        updateTemplateAndReload={updateTemplateAndReload} // TemplatesMy (親) 側で持っている関数を、モーダルウィンドウ側 (子) に渡す設定
      />
      <ModalWindowsForDeleteTemplate // テンプレート編集用のモーダルウィンドウ
        ref={deleteModalWindow} // モーダルウィンドウ側 (子) の関数を、TemplatesMy (親) 側で呼び出すための参照設定
        deleteTemplateAndReload={deleteTemplateAndReload} // TemplatesMy (親) 側で持っている関数を、モーダルウィンドウ側 (子) に渡す設定
      />
    </div>
  );
};

export default TemplatesMy;






// State をこのページだけで利用していて、動作しているコード
// import React, { useEffect, useState } from 'react';
// import Button from '../components/Button';
// import Card from '../components/Card';
// import { useNavigate } from 'react-router-dom';
// import useTemplates from '../hooks/useTemplate';
// import {
//   GetTemplatesByUserResponse,
// } from 'generative-ai-use-cases-jp';



// const TemplatesMy: React.FC = () => {
//   const navigate = useNavigate();

//   // useTemplate で定義した API を取り出す
//   const {
//     getTemplateList,
//     readmoreTemplateList,
//   } = useTemplates();

//   // ステートの定義で、templateList を管理するための useState フック
//   const [templateList, setTemplateList] = useState<GetTemplatesByUserResponse | null>(null);

//   console.log(templateList);

//   // テンプレート新規作成ページに移動する関数
//   const createTemplate = () => {
//     navigate('/templates/create', {
//     });
//   };

//   // 画面表示時に、自分が作成したテンプレートリストを取得して、State に格納する
//   useEffect(() => {
//     (async () => {
//       const response = await getTemplateList();
//       console.log(response);

//       setTemplateList(response);
//     })()
//   }, []);

//   // ReadMore ボタンが押されたときに、再度、データを取得する処理
//   const readMore = async () => {
//     if (templateList?.LastEvaluatedKey) {

//       const response = await readmoreTemplateList(btoa(JSON.stringify(templateList.LastEvaluatedKey)));
//       console.log(templateList);

//       if (response?.items) {
//         setTemplateList(prevState => ({
//           ...response,
//           items: [...(prevState?.items || []), ...response.items]
//         }));
//       }
//     }
//   };

//   return (
//     <div className="grid grid-cols-5 gap-4">
//       <div className="invisible col-span-5 my-2 flex h-0 items-center justify-center text-xl font-semibold print:visible print:my-5 print:h-min lg:visible lg:my-5 lg:h-min">
//         マイテンプレート
//       </div>
//       <div className="flex h-11 gap-3 col-start-1 col-end-6 lg:col-end-5 mr-2 justify-end">
//         <Button onClick={createTemplate}>
//           + 新規作成
//         </Button>
//       </div>
//       <div className="text-lg font-semibold col-start-1 lg:col-start-2 ml-2 col-span-full">
//         作成したテンプレート
//       </div>
//       {
//         templateList?.items.map((template, index) => (
//           <Card className="flex gap-3 col-start-1 lg:col-start-2 col-end-6 lg:col-end-5 ml-2 mr-2 justify-end" key={index} label={template.title}>{template.prompt}</Card>
//         ))
//       }
//       {
//         templateList?.LastEvaluatedKey && (
//           <Button className="shrink w-28 h-11 gap-3 col-start-3 justify-self-center" onClick={readMore}>
//             Read More
//           </Button>
//         )
//       }
//     </div>
//   );
// };

// export default TemplatesMy;