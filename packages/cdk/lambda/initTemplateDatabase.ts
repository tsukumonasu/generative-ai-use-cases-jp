import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import {
    Handler,
    CdkCustomResourceEvent,
    CdkCustomResourceResponse,
    Context,
} from 'aws-lambda';

export const handler: Handler = async (event: any, context: Context,) => {
    // Log 出力
    console.log('Lambda is invoked with:' + JSON.stringify(event));

    const client = new DynamoDBClient({});
    const ddbDocClient = DynamoDBDocumentClient.from(client);
    const tableName = process.env.TABLE_NAME;
    const items = [
        { tagname: 'デザイナー', tagid: '00000000-0000-0000-0000-000000000001', gsi_pk: 'templateCount', gsi_sk: 0},
        { tagname: '営業', tagid: '00000000-0000-0000-0000-000000000002', gsi_pk: 'templateCount', gsi_sk: 0 },
        { tagname: 'マーチャンダイザー', tagid: '00000000-0000-0000-0000-000000000003', gsi_pk: 'templateCount', gsi_sk: 0 },
    ];

    for (const item of items) {
        await ddbDocClient.send(new PutCommand({ TableName: tableName, Item: item }));
    }
};


// CDK でカスタムリソースを定義した場合の関数 (動かなかったもの)
// export const handler: Handler = async (event: CdkCustomResourceEvent, context: Context,): Promise<CdkCustomResourceResponse> => {
//     // Log 出力
//     console.log('Lambda is invoked with:' + JSON.stringify(event));

//     // CustomResource 用のレスポンス構造体を宣言
//     const response: CdkCustomResourceResponse = {
//         StackId: event.StackId,
//         RequestId: event.RequestId,
//         LogicalResourceId: event.LogicalResourceId,
//         PhysicalResourceId: context.logGroupName,
//     };

//     if (event.RequestType == 'Delete') {
//         response.Status = 'SUCCESS';
//         response.Data = { Result: 'None' };
//         return response;
//     }

//     try {
//         const client = new DynamoDBClient({});
//         const ddbDocClient = DynamoDBDocumentClient.from(client);
//         const tableName = process.env.TABLE_NAME;
//         const items = [
//             { name: 'デザイナー', tagid: '00000000-0000-0000-0000-000000000001' },
//             { name: '営業', tagid: '00000000-0000-0000-0000-000000000002' },
//             { name: 'マーチャンダイザー', tagid: '00000000-0000-0000-0000-000000000003' },
//         ];

//         for (const item of items) {
//             await ddbDocClient.send(new PutCommand({ TableName: tableName, Item: item }));
//         }

//         response.Status = 'SUCCESS';
//         response.Data = { Result: 'SUCCESS' };

//         console.log('Lambda response:' + JSON.stringify(response));

//         return response;
//     } catch (error) {
//         if (error instanceof Error) {
//             response.Reason = error.message;
//         }
//         response.Status = 'FAILED';
//         response.Data = { Result: error };

//         console.log('Lambda response:' + JSON.stringify(response));
//         return response;
//     }
// };
