import { Fragment, useRef, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
    PiWarning,
} from 'react-icons/pi';
import { useImperativeHandle, forwardRef } from 'react';
import {
    DeleteTemplateRequest,
    DeleteTemplateResponse,
    Template as TemplateType,
} from 'generative-ai-use-cases-jp';

// 呼び出し元の画面へ、モーダルウィンドウの開閉を行う関数を公開する為に利用する Interface
export interface DeleteModalWindowHandle {
    openModalWindow: (template: TemplateType) => void;
}

// モーダルウィンドウの定義、および、開閉関数の定義
const ModalWindowsForDeleteTemplate = forwardRef<DeleteModalWindowHandle, { deleteTemplateAndReload: (newTemplate: DeleteTemplateRequest) => Promise<DeleteTemplateResponse> }>((props, ref) => {
    // 呼び出し元の画面へ公開する関数
    useImperativeHandle(ref, () => ({
        // template の値を受け取って画面に入力して、モーダルウィンドウを開く
        openModalWindow(template: TemplateType) {
            // 編集対象の Template の情報を State に保存する
            setTargetTemplate(template);
            setOpen(true);
        }
    }));

    // モーダルウィンドウの開閉を管理する State
    const [open, setOpen] = useState(false);

    // Update 対象の Template の情報を一時的に保存する State
    let template: TemplateType = {
        id: "",
        templateid: "",
        title: "",
        prompt: "",
        public: false,
        usermailaddress: "",
        tags: {},
        createdDate: "",
        copycount: 0,
        gsi_pk: "",
        gsi_sk: "",
    };

    const [targetTemplate, setTargetTemplate] = useState(template);

    // TemplateCreate API を実行中の場合は画面上でスピンを回すための State
    const [isDeleting, setIsDeleting] = useState(false);

    const cancelButtonRef = useRef(null)

    // Template を削除して、再度リロードする
    const execDeleteTemplateAndReload = async () => {
        setIsDeleting(true);

        console.log(targetTemplate);

        const request: DeleteTemplateRequest = {
            id: targetTemplate.templateid,
        }

        // UpdateTemplate の API を実行
        await props.deleteTemplateAndReload(request);

        setIsDeleting(false);
        setOpen(false);
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
                            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                            <PiWarning className="h-6 w-6 text-red-600" aria-hidden="true" />
                                        </div>
                                        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                                            <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                                                テンプレートの削除
                                            </Dialog.Title>
                                            <div className="mt-2">
                                                <p className="text-sm text-gray-500">
                                                    本当にテンプレートを削除してもよろしいですか？
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                                    <button
                                        type="button"
                                        className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                                        onClick={() => execDeleteTemplateAndReload()}
                                    >
                                        {
                                            isDeleting ? (
                                                <div className="h-5 w-5 animate-spin rounded-full border-4 border-t-transparent"></div>
                                            ) : (
                                                '削除'
                                            )
                                        }
                                    </button>
                                    <button
                                        type="button"
                                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                                        onClick={() => setOpen(false)}
                                        ref={cancelButtonRef}
                                    >
                                        キャンセル
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    )
})

export default ModalWindowsForDeleteTemplate;