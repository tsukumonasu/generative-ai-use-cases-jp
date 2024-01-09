import {
  Model,
  RecordedMessage,
  ToBeRecordedMessage,
  UnrecordedMessage,
} from './message';
import { Chat } from './chat';
import {
  QueryCommandOutput,
  RetrieveCommandOutput,
} from '@aws-sdk/client-kendra';
import { GenerateImageParams } from './image';
import { MediaFormat } from '@aws-sdk/client-transcribe';

export type CreateChatResponse = {
  chat: Chat;
};

export type CreateMessagesRequest = {
  messages: ToBeRecordedMessage[];
};

export type CreateMessagesResponse = {
  messages: RecordedMessage[];
};

export type ListChatsResponse = {
  chats: Chat[];
};

export type FindChatByIdResponse = {
  chat: Chat;
};

export type ListMessagesResponse = {
  messages: RecordedMessage[];
};

export type UpdateFeedbackRequest = {
  createdDate: string;
  feedback: string;
};

export type UpdateFeedbackResponse = {
  message: RecordedMessage;
};

export type UpdateTitleRequest = {
  title: string;
};

export type UpdateTitleResponse = {
  chat: Chat;
};

export type PredictRequest = {
  model?: Model;
  messages: UnrecordedMessage[];
};

export type PredictResponse = string;

export type PredictTitleRequest = {
  chat: Chat;
  messages: UnrecordedMessage[];
};

export type PredictTitleResponse = string;

export type QueryKendraRequest = {
  query: string;
};

export type QueryKendraResponse = QueryCommandOutput;

export type RetrieveKendraRequest = {
  query: string;
};

export type RetrieveKendraResponse = RetrieveCommandOutput;

export type GenerateImageRequest = {
  model?: Model;
  params: GenerateImageParams;
};
export type GenerateImageResponse = string;

export type GetSignedUrlRequest = {
  mediaFormat: MediaFormat;
};

export type GetSignedUrlResponse = string;

export type StartTranscriptionRequest = {
  audioUrl: string;
};

export type StartTranscriptionResponse = {
  jobName: string;
};

export type GetTranscriptionResponse = {
  status: string;
  transcript?: string;
};

export type UploadAudioRequest = {
  file: File;
};

export type WebTextRequest = {
  url: string;
};

export type WebTextResponse = {
  text: string;
};

export type GetTemplatesByUserRequest = {
};

export type Template = {
  id: string;
  templateid: string;
  title: string;
  prompt: string;
  public: boolean;
  usermailaddress: string;
  tags: Record<string, string>;
  createdDate: string;
  copycount: string;
  gsi_pk: string;
  gsi_sk: string;
};

export type GetTemplatesByUserResponse = {
  items: Template[],
  LastEvaluatedKey: {
    [key: string]: string;
  };
}

export type CreateTemplateRequest = {
  title: string;
  prompt: string;
  public: boolean;
  tags: string[];
}

export type CreateTemplateResponse = {
  recordedTemplate: Template;
}

export type UpdateTemplateRequest = {
  id: string;
  templateid: string;
  title: string;
  prompt: string;
  public: boolean;
  tags: string[];
}

export type UpdateTemplateResponse = {
  response: string;
}

export type DeleteTemplateRequest = {
  id: string;
}

export type DeleteTemplateResponse = {
  response: string;
}

export type Tag = {
  tagname: string;
  tagid: string;
  gsi_pk: string;
  gsi_sk: string;
};


export type GetTagsResponse = {
  items: Tag[],
  LastEvaluatedKey: {
    [key: string]: string;
  };
}

export type GetTagDetailResponse = Tag;

export type GetTemplatesByTagRequest = {
  tagid: string,
  sortBy: 'createdDate' | 'copycount',
  LastEvaluatedKey?: string,
};

export type GetTemplatesByTagResponse = {
  items: Template[],
  LastEvaluatedKey?: {
    [key: string]: string;
  };
};