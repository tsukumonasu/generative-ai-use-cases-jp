import React from 'react';
import ReactDOM from 'react-dom/client';
import AuthWithUserpool from './components/AuthWithUserpool';
import AuthWithSAML from './components/AuthWithSAML';
import './index.css';
import {
  RouterProvider,
  createBrowserRouter,
  RouteObject,
} from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Setting from './pages/Setting';
import ChatPage from './pages/ChatPage';
import SharedChatPage from './pages/SharedChatPage';
import SummarizePage from './pages/SummarizePage';
import GenerateTextPage from './pages/GenerateTextPage';
import EditorialPage from './pages/EditorialPage';
import TranslatePage from './pages/TranslatePage';
import VideoAnalyzerPage from './pages/VideoAnalyzerPage';
import NotFound from './pages/NotFound';
import KendraSearchPage from './pages/KendraSearchPage';
import RagPage from './pages/RagPage';
import WebContent from './pages/WebContent';
import GenerateImagePage from './pages/GenerateImagePage';
import TranscribePage from './pages/TranscribePage';
import TemplatesMy from './pages/TemplatesMy.tsx';
import TemplatesTagSelect from './pages/TemplatesTagSelect.tsx';
import TemplatesByTag from './pages/TemplatesByTag.tsx';
import TemplateDetail from './pages/TemplateDetail.tsx';
import AgentChatPage from './pages/AgentChatPage.tsx';
import FileUploadPage from './pages/FileUploadPage.tsx';
import { MODELS } from './hooks/useModel';

const ragEnabled: boolean = import.meta.env.VITE_APP_RAG_ENABLED === 'true';
const samlAuthEnabled: boolean =
  import.meta.env.VITE_APP_SAMLAUTH_ENABLED === 'true';
const agentEnabled: boolean = import.meta.env.VITE_APP_AGENT_ENABLED === 'true';
const recognizeFileEnabled: boolean =
  import.meta.env.VITE_APP_RECOGNIZE_FILE_ENABLED === 'true';
const { multiModalModelIds } = MODELS;
const multiModalEnabled: boolean = multiModalModelIds.length > 0;

const routes: RouteObject[] = [
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/setting',
    element: <Setting />,
  },
  {
    path: '/chat',
    element: <ChatPage />,
  },
  {
    path: '/chat/:chatId',
    element: <ChatPage />,
  },
  {
    path: '/share/:shareId',
    element: <SharedChatPage />,
  },
  {
    path: '/generate',
    element: <GenerateTextPage />,
  },
  {
    path: '/summarize',
    element: <SummarizePage />,
  },
  {
    path: '/editorial',
    element: <EditorialPage />,
  },
  {
    path: '/translate',
    element: <TranslatePage />,
  },
  {
    path: '/web-content',
    element: <WebContent />,
  },
  {
    path: '/image',
    element: <GenerateImagePage />,
  },
  {
    path: '/transcribe',
    element: <TranscribePage />,
  },
  multiModalEnabled
    ? {
        path: '/video',
        element: <VideoAnalyzerPage />,
      }
    : null,
  recognizeFileEnabled
    ? {
        path: '/file',
        element: <FileUploadPage />,
      }
    : null,
  ragEnabled
    ? {
        path: '/rag',
        element: <RagPage />,
      }
    : null,
  ragEnabled
    ? {
        path: '/kendra',
        element: <KendraSearchPage />,
      }
    : null,
  agentEnabled
    ? {
        path: '/agent',
        element: <AgentChatPage />,
      }
    : null,
  {
    path: '/templates/mytemplate',
    element: <TemplatesMy />,
  },
  {
    path: '/templates/tags',
    element: <TemplatesTagSelect />,
  },
  {
    path: '/templates/tags/:tagid',
    element: <TemplatesByTag />,
  },
  {
    path: '/templates/:templateid',
    element: <TemplateDetail />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
].flatMap((r) => (r !== null ? [r] : []));

const router = createBrowserRouter([
  {
    path: '/',
    element: samlAuthEnabled ? <AuthWithSAML /> : <AuthWithUserpool />,
    children: routes,
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
