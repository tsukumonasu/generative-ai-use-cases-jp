import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient();
const dynamoDb = DynamoDBDocumentClient.from(client);

// copycount のカウントアップ
async function updateTemplate(templateid: string): Promise<boolean> {
    const templateTableName: string = process.env.TEMPLATE_TABLE_NAME!;

    // DynamoDB 上に保存されている、更新前のデータを取得する
    const getCommand = new QueryCommand({
        TableName: templateTableName,
        KeyConditionExpression: 'id = :id AND templateid = :templateid',
        ExpressionAttributeValues: {
            ':id': 'template#' + templateid,
            ':templateid': templateid
        }
    });

    const getResult = await dynamoDb.send(getCommand);
    let existTemplate;
    if (getResult.Items && getResult.Items.length > 0) {
        existTemplate = getResult.Items[0];
    } else {
        console.log("DynamoDB テーブルにデータが存在しませんでした。id : " + templateid + ", templateid : " + templateid);
        return false
    }

    // copycount の値をインクリメントするための UpdateCommand を作成
    const updateCommand = new UpdateCommand({
        TableName: templateTableName,
        Key: {
            'id': 'template#' + templateid,
            'templateid': templateid
        },
        UpdateExpression: 'SET copycount = if_not_exists(copycount, :start) + :inc',
        ExpressionAttributeValues: {
            ':start': 0,
            ':inc': 1
        },
        ReturnValues: 'UPDATED_NEW'
    });

    const updateResult = await dynamoDb.send(updateCommand);

    if (!updateResult.Attributes) {
        console.error('No attributes returned from the update operation');
        return false;
    }

    // Template に設定されている Tag 一覧を利用して、各 Tag も値を更新する
    const existTags = existTemplate.tags;

    for (const tagId of Object.keys(existTags)) {
        console.log('Processing tag#' + tagId);

        const updateTagCommand = new UpdateCommand({
            TableName: templateTableName,
            Key: {
                'id': 'tag#' + tagId,
                'templateid': templateid
            },
            UpdateExpression: 'SET copycount = :copycount',
            ExpressionAttributeValues: {
                ':copycount': updateResult.Attributes.copycount
            }
        });
        const response = await dynamoDb.send(updateTagCommand);
        if (!response || response.$metadata.httpStatusCode !== 200) {
            return false;
        }
    }

    return true
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // Log 出力
    console.log('Lambda event:' + JSON.stringify(event));


    try {
        const templateId = event.pathParameters?.templateId ? event.pathParameters.templateId : "";

        const success = await updateTemplate(templateId);

        if (!success) {
            return {
                statusCode: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({
                    message: 'Failed to increment copycount for templateid: ' + templateId,
                }),
            };
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                message: 'Finished copycount incremenl. templateid :' + templateId,
            }),
        };
    } catch (err) {
        console.log(err);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                message: 'some error happened',
            }),
        };
    }
};
