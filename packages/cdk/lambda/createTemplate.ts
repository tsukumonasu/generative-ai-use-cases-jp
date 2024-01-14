import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient();
const dynamoDb = DynamoDBDocumentClient.from(client);

interface Request {
    id: string;
    templateid: string;
    title: string;
    prompt: string;
    public: boolean;
    usermailaddress: string,
    tags: Record<string, string>;
    createdDate: string,
    copycount: number,
    gsi_pk: string,
    gsi_sk: string,
}

// 入力された Tag に対して、処理を行う。
// 新規 Tag の場合は uuid を新たに発行する。既存の Tag の場合は、既存の id を取得する。
async function getAndGenerateTagIds(tags: string[]): Promise<Record<string, string>> {
    const tagTableName = process.env.TAG_TABLE_NAME;

    const tagsRecord: Record<string, string> = {};
    for (const tag of tags) {
        // DynamoDBで既存のタグを検索
        const queryCommand = new QueryCommand({
            TableName: tagTableName,
            KeyConditionExpression: 'tagname = :tagname',
            ExpressionAttributeValues: {
                ':tagname': tag
            }
        });

        const queryResult = await dynamoDb.send(queryCommand);

        let tagId;
        if (queryResult.Items && queryResult.Items.length > 0) {
            // 既存のタグが見つかった場合、そのtagidを使用
            tagId = queryResult.Items[0].tagid;

            // templateCount を増やす
            const updateCommand = new UpdateCommand({
                TableName: tagTableName,
                Key: {
                    'tagname': tag,
                },
                UpdateExpression: 'SET gsi_sk = gsi_sk + :inc',
                ExpressionAttributeValues: {
                    ':inc': 1
                }
            });

            await dynamoDb.send(updateCommand);
        } else {
            // 新しいタグを作成
            tagId = uuidv4();
            const putCommand = new PutCommand({
                TableName: tagTableName,
                Item: {
                    tagname: tag,
                    tagid: tagId,
                    gsi_pk: "templateCount",
                    gsi_sk: 1,
                }
            });
            await dynamoDb.send(putCommand);
        }

        tagsRecord[tagId] = tag;
    }

    return tagsRecord;
}

async function createTemplate(requestBody: Request): Promise<boolean> {
    const templateTableName = process.env.TEMPLATE_TABLE_NAME;

    // Template そのものの Item を作成する
    const putCommand = new PutCommand({
        TableName: templateTableName,
        Item: {
            id: requestBody.id,
            templateid: requestBody.templateid,
            title: requestBody.title,
            prompt: requestBody.prompt,
            public: requestBody.public,
            usermailaddress: requestBody.usermailaddress,
            tags: requestBody.tags,
            createdDate: requestBody.createdDate,
            copycount: requestBody.copycount,
            gsi_pk: requestBody.gsi_pk,
            gsi_sk: requestBody.gsi_sk,
        }
    });

    const templateResponse = await dynamoDb.send(putCommand);
    if (!templateResponse || templateResponse.$metadata.httpStatusCode !== 200) {
        return false;
    }

    // Template と Tag の紐づけを行う
    for (const tagId in requestBody.tags) {
        const tagAssociationPutCommand = new PutCommand({
            TableName: templateTableName,
            Item: {
                id: 'tag#' + tagId,
                templateid: requestBody.templateid,
                createdDate: requestBody.createdDate,
                copycount: requestBody.copycount
            }
        });
        const tagAssociationResponse = await dynamoDb.send(tagAssociationPutCommand);
        if (!tagAssociationResponse || tagAssociationResponse.$metadata.httpStatusCode !== 200) {
            return false;
        }
    }

    return true
}


export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // Log 出力
    console.log('Lambda event:' + JSON.stringify(event));

    try {
        // event から Request を生成する。
        const body = event.body ? JSON.parse(event.body) : {};
        const uuid = uuidv4();
        const timestamp = new Date().getTime().toString();
        let tags = body.tags;

        const userId: string =
            event.requestContext.authorizer!.claims['cognito:username'];
        const usermailaddress: string =
            event.requestContext.authorizer!.claims['email'];


        // 公開設定を「公開」に指定したときに、入力された Tag の id を取得する。新規 Tag の場合は uuid を新たに発行する。既存の Tag の場合は、既存の id を取得する。
        if (body.public) {
            tags = await getAndGenerateTagIds(tags);
        } else {
            tags = [];
        }

        const requestBody: Request = {
            id: "template#" + uuid,
            templateid: uuid,
            title: body.title,
            prompt: body.prompt,
            public: body.public,
            usermailaddress: usermailaddress,
            tags: tags,
            createdDate: timestamp,
            copycount: 0, // 文字列で 12 桁を持つ
            gsi_pk: "userid",
            gsi_sk: userId + "#" + timestamp
        };

        console.log(requestBody);

        // Template を新規作成する
        const success = await createTemplate(requestBody);

        if (!success) {
            return {
                statusCode: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({
                    message: 'Error creating template',
                }),
            };
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify(requestBody),
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
