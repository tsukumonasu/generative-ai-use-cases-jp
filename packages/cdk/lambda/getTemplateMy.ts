import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient();
const dynamoDb = DynamoDBDocumentClient.from(client);

interface ResponseType {
    items?: any[];
    LastEvaluatedKey?: Record<string, any>;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // Log 出力
    console.log('Lambda event:' + JSON.stringify(event));

    const userId: string =
        event.requestContext.authorizer!.claims['cognito:username'];

    const tableName: string = process.env.TEMPLATE_TABLE_NAME!;
    const indexName: string = process.env.TEMPLATE_TABLE_GSI_INDEX_NAME!;

    const params: {
        TableName: string;
        IndexName: string;
        KeyConditionExpression: string;
        ExpressionAttributeValues: { ':pk': string; ':sk': string; };
        Limit: number;
        ExclusiveStartKey?: Record<string, any>;
        ScanIndexForward: boolean;
    } = {
        TableName: tableName,
        IndexName: indexName,
        KeyConditionExpression: 'gsi_pk = :pk and begins_with(gsi_sk, :sk)',
        ExpressionAttributeValues: {
            ':pk': 'userid',
            ':sk': userId
        },
        Limit: 10,
        ScanIndexForward: false, // 降順
    };

    // GET の URL パラメーターから、lastEvaluatedKey があれば取得する。ページ機能に利用する。
    let lastEvaluatedKey = null;
    if (event.queryStringParameters && event.queryStringParameters.lastEvaluatedKey) {
        const lastEvaluatedKey = JSON.parse(atob(event.queryStringParameters.lastEvaluatedKey));
        params.ExclusiveStartKey = lastEvaluatedKey;
        console.log(lastEvaluatedKey)
    }

    try {
        // DynamoDB にクエリーを実行
        const command = new QueryCommand(params);
        const data = await dynamoDb.send(command);

        console.log("data : " + data.Items)

        const response: ResponseType = {};

        // DynamoDB のクエリー結果が存在する場合は、return のデータを生成する
        if (data.Items && data.Items.length > 0) {
            response.items = data.Items;

            // LastEvaluatedKey が存在する場合は、Return に含める。ページ送り機能を実装するために必要。
            if (data.LastEvaluatedKey) {
                response.LastEvaluatedKey = data.LastEvaluatedKey;
            }
        }

        // Log 出力
        console.log('Lambda return:' + JSON.stringify(response));

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify(response)
        };
    } catch (error) {
        console.log(error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ message: 'Internal Server Error' }),
        };
    }
};
