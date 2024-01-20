import { Fragment, useRef, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import Button from '../components/Button';
import { useImperativeHandle, forwardRef } from 'react';
import {
  CreateTemplateRequest,
  CreateTemplateResponse,
} from 'generative-ai-use-cases-jp';

// 呼び出し元の画面へ、モーダルウィンドウの開閉を行う関数を公開する為に利用する Interface
export interface CreateModalWindowHandle {
  openModalWindow: () => void;
}

// モーダルウィンドウの定義、および、開閉関数の定義
const ModalWindowsForCreateTemplate = forwardRef<CreateModalWindowHandle, { createTemplateAndReload: (newTemplate: CreateTemplateRequest) => Promise<CreateTemplateResponse> }>((props, ref) => {
  // 呼び出し元の画面へ公開する関数
  useImperativeHandle(ref, () => ({
    openModalWindow() {
      setOpen(true);
    }
  }));

  // モーダルウィンドウの開閉を管理する State
  const [open, setOpen] = useState(false)

  // タイトルを管理する State。「作成ボタン」を押せるかどうかの判定に利用する
  const [title, setTitle] = useState('');

  // プロンプトを管理する State。「作成ボタン」を押せるかどうかの判定に利用する
  const [prompt, setPrompt] = useState('');

  // 公開設定を管理する State。「作成ボタン」を押せるかどうかの判定に利用する
  const [shareSetting, setShareSetting] = useState('private');

  // 主な利用ユーザーの入力欄を管理する State
  const [useCase, setUseCase] = useState('');

  // タグの入力欄を管理する State
  const [tagsInputs, setTagsInputs] = useState<string[]>([]);

  // TemplateCreate API を実行中の場合は画面上でスピンを回すための State
  const [isCreating, setIsCreating] = useState(false);

  const cancelButtonRef = useRef(null)

  // タイトルとプロンプトと公開設定が入力された状態を判定し、全て正常であれば「作成ボタン」を押下可能と判断する。
  const isFormValid = () => {
    return title.trim() !== '' && prompt.trim() !== '' && shareSetting !== '';
  };

  // タグの入力フィールドを追加する関数
  const addTagInput = () => {
    if (tagsInputs.length < 5) {
      setTagsInputs([...tagsInputs, '']);
    } else {
      alert('タグは最大5つまでです。');
    }
  };

  // Template を作成して、再度リロードする
  const execCreateTemplateAndReload = async () => {
    setIsCreating(true);

    let tags = tagsInputs;

    // 公開設定に応じて tags の値を変更する
    if (shareSetting === 'private') {
      tags = []; // 公開設定が private の場合は tags を空にする
    } else if (shareSetting === 'public' && useCase.trim() !== '') {
      tags = [...tagsInputs.filter(tag => tag.trim() !== '')]; // 空のタグを除外
      tags.push(useCase); // 公開設定が public の場合は useCase の値を tags に追加する
    }

    // CreateTemplate を行うためのリクエストを作成
    const createTemplateRequest: CreateTemplateRequest = {
      title: title,
      prompt: prompt,
      public: shareSetting === 'public', // 公開設定が 'public' の場合は true, それ以外は false
      tags: tags, 
    }

    // CreateTemplate の API を実行
    await props.createTemplateAndReload(createTemplateRequest);

    setIsCreating(false);
  }

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" initialFocus={cancelButtonRef} onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all mx-8 sm:my-8 w-full xl:max-w-7xl">
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:ml-0 sm:mt-0 sm:text-left">
                      <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                        新規テンプレート作成
                      </Dialog.Title>
                    </div>
                    
                  </div>
                  <div className="border-b border-gray-900/10 my-8"></div>
                  {/* form ここから */}
                  <form onSubmit={(e) => e.preventDefault()}>
                    <div className="space-y-12">
                      <div className="border-b border-gray-900/10 pb-12">
                        <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                          <div className="col-span-full">
                            <label htmlFor="title" className="block text-sm font-medium leading-6 text-gray-900">
                              タイトル
                            </label>
                            <div className="mt-2">
                              <input
                                type="text"
                                name="title"
                                id="title"
                                autoComplete="title"
                                placeholder="テンプレートのタイトルを入力"
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="col-span-full">
                            <label htmlFor="prompt" className="block text-sm font-medium leading-6 text-gray-900">
                              プロンプト
                            </label>
                            <div className="mt-2">
                              <textarea
                                id="prompt"
                                name="prompt"
                                rows={5}
                                placeholder="チャットに入力する指示や質問を記載"
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                              />
                            </div>
                          </div>

                          <fieldset className="col-span-full">
                            <legend className="text-sm font-semibold leading-6 text-gray-900">公開設定</legend>
                            <p className="mt-1 text-sm leading-6 text-gray-600"></p>
                            <div className="mt-6 space-y-6">
                              <div className="flex items-center gap-x-3">
                                <input
                                  id="private"
                                  name="template-share"
                                  type="radio"
                                  className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600" value="private"
                                  onChange={(e) => setShareSetting(e.target.value)}
                                  checked={shareSetting === 'private'}
                                />
                                <label htmlFor="private" className="block text-sm font-medium leading-6 text-gray-900">
                                  非公開
                                </label>
                              </div>
                              <div className="flex items-center gap-x-3">
                                <input
                                  id="public"
                                  name="template-share"
                                  type="radio"
                                  className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                  value="public"
                                  onChange={(e) => setShareSetting(e.target.value)}
                                  checked={shareSetting === 'public'}
                                />
                                <label htmlFor="public" className="block text-sm font-medium leading-6 text-gray-900">
                                  公開
                                </label>
                              </div>
                            </div>
                          </fieldset>
                          
                          <div className="col-span-full">
                            <label htmlFor="usecase" className="block text-sm font-medium leading-6 text-gray-900">
                              主な利用ユーザー
                            </label>
                            <div className="mt-2">
                              <select
                                id="usecase"
                                name="usecase"
                                autoComplete="usecase-name"
                                className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6 ${shareSetting === 'private' ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : ''}`}
                                value={useCase} // state を value にバインド
                                onChange={(e) => setUseCase(e.target.value)}
                                disabled={shareSetting === 'private'}
                              >
                                <option value="">指定なし</option>
                                <option value="デザイナー">デザイナー</option>
                                <option value="営業">営業</option>
                                <option value="マーチャンダイザー">マーチャンダイザー</option>
                              </select>
                            </div>
                          </div>
                          <div className="col-span-full">
                            <label htmlFor="tags" className="block text-sm font-medium leading-6 text-gray-900">
                              タグ (上限 5 個)
                            </label>
                            <div className="mt-2">
                              {tagsInputs.map((tag, index) => ( // 入力欄の追加ボタンを押したときに、入力欄を増やす
                                <div key={index} className="flex items-center">
                                  <input
                                    type="text"
                                    name={`tags-${index}`}
                                    id={`tags-${index}`}
                                    autoComplete="tags"
                                    placeholder="タグを入力"
                                    className={`block rounded-md border-0 my-1 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 ${shareSetting === 'private' ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : ''}`}
                                    value={tag}
                                    disabled={shareSetting === 'private'}
                                    onChange={(e) => {
                                      const newTags = [...tagsInputs];
                                      newTags[index] = e.target.value;
                                      setTagsInputs(newTags);
                                    }}
                                  />
                                  <Button
                                    type="button"
                                    outlined
                                    className="ml-2 shrink"
                                    disabled={shareSetting === 'private'}
                                    onClick={() => {
                                      const newTags = tagsInputs.filter((_, i) => i !== index);
                                      setTagsInputs(newTags);
                                    }}
                                  >
                                    クリア
                                  </Button>
                                </div>
                              ))}
                              <Button
                                type="button"
                                className="mt-2 shrink"
                                onClick={addTagInput}
                                disabled={shareSetting === 'private'}
                              >
                                入力欄の追加
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                  {/* form ここまで  */}
                </div>
                <div className="flex justify-end px-4 py-6">
                  <Button
                    outlined
                    className="shrink font-semibold w-24 h-9 mx-1"
                    onClick={() => setOpen(false)}
                  >
                    キャンセル
                  </Button>
                  <Button
                    className={`shrink font-semibold w-24 h-9 mx-1 ${!isFormValid() && 'opacity-50 cursor-not-allowed'}`}
                    onClick={async () => { 
                      if (isFormValid()) {
                        // Public Private で渡すパラメーターをコントロールしたい
                        await execCreateTemplateAndReload();
                        setOpen(false);
                      }
                    }}
                    disabled={!isFormValid()}
                  >
                    {
                      isCreating ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-4 border-t-transparent"></div>
                      ) : (
                        '作成'
                      )
                    }
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
})

export default ModalWindowsForCreateTemplate;