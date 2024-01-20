import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, PutCommand, DeleteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

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
    // copycount: string,
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

// tag テーブルの templateCount を集計して
async function updateTemplateCount(taglist: Record<string, string>): Promise<void> {
    const templateTableName = process.env.TEMPLATE_TABLE_NAME;
    const tagTableName = process.env.TAG_TABLE_NAME;

    // タグに紐づくテンプレートが完全に 0 件になったときに、そのタグを削除する。
    // 営業, デザイナー, マーチャンダイザー は除外
    for (const [tagId, tagName] of Object.entries(taglist)) {
        // ここで DynamoDB に対してクエリーを実行します。
        const queryCommand = new QueryCommand({
            TableName: templateTableName,
            KeyConditionExpression: 'id = :id',
            ExpressionAttributeValues: {
                ':id': 'tag#' + tagId
            }
        });

        const queryResult = await dynamoDb.send(queryCommand);

        if (tagName === '営業' || tagName === 'デザイナー' || tagName === 'マーチャンダイザー') {
            // タグテーブルの templateCount (gsi_sk) を減らす
            const updateCommand = new UpdateCommand({
                TableName: tagTableName,
                Key: {
                    'tagname': tagName,
                },
                UpdateExpression: 'SET gsi_sk = :newCount',
                ExpressionAttributeValues: {
                    ':newCount': queryResult.Items.length,
                }
            });

            await dynamoDb.send(updateCommand);
            continue;
        }

        if (queryResult.Items && queryResult.Items.length === 0) {
            console.log(`Deleting tagId: ${tagId}, tagName: ${tagName}`);

            // タグに紐づくテンプレートがない場合、タグを削除する
            const deleteCommand = new DeleteCommand({
                TableName: tagTableName,
                Key: {
                    'tagname': tagName,
                }
            });
            await dynamoDb.send(deleteCommand);
        } else if (queryResult.Items && queryResult.Items.length > 0) {
            // タグテーブルの templateCount (gsi_sk) を減らす
            const updateCommand = new UpdateCommand({
                TableName: tagTableName,
                Key: {
                    'tagname': tagName,
                },
                UpdateExpression: 'SET gsi_sk = :newCount',
                ExpressionAttributeValues: {
                    ':newCount': queryResult.Items.length,
                }
            });

            await dynamoDb.send(updateCommand);
        }
    }
}

// Template の更新
async function updateTemplate(requestBody: Request): Promise<boolean> {
    const templateTableName = process.env.TEMPLATE_TABLE_NAME;

    // DynamoDB 上に保存されている、更新前のデータを取得する
    const getCommand = new QueryCommand({
        TableName: templateTableName,
        KeyConditionExpression: 'id = :id AND templateid = :templateid',
        ExpressionAttributeValues: {
            ':id': requestBody.id,
            ':templateid': requestBody.templateid
        }
    });

    const getResult = await dynamoDb.send(getCommand);
    let existTemplate;
    if (getResult.Items && getResult.Items.length > 0) {
        existTemplate = getResult.Items[0];
    } else {
        console.log("DynamoDB テーブルにデータが存在しませんでした。id : " + requestBody.id + ", templateid : " + requestBody.templateid);
        return false
    }

    // Template の Item を更新する
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
            copycount: existTemplate.copycount,
            gsi_pk: requestBody.gsi_pk,
            gsi_sk: requestBody.gsi_sk,
        }
    });

    const templateResponse = await dynamoDb.send(putCommand);
    if (!templateResponse || templateResponse.$metadata.httpStatusCode !== 200) {
        return false;
    }

    // Template と Tag の紐づけを行う
    const existTags = existTemplate.tags;   // 現在 DynamoDB で設定されているタグ
    const updatedTags = requestBody.tags;   // 設定すべき新タグ
    const deletedTags: Record<string, string> = Object.keys(existTags) // 削除すべきタグを抽出する。existTags に存在していて、updatedTags に存在していないものが対象。
        .filter(tagId => !Object.keys(updatedTags).includes(tagId))
        .reduce((acc, tagId) => {
            acc[tagId] = existTags[tagId];
            return acc;
        }, {} as Record<string, string>);

    // 新規または継続して使用するタグの処理
    for (const tagId of Object.keys(updatedTags)) {
        console.log('Processing tag#' + tagId);

        const putCommand = new PutCommand({
            TableName: templateTableName,
            Item: {
                id: 'tag#' + tagId,
                templateid: requestBody.templateid,
                copycount: existTemplate.copycount,
                createdDate: requestBody.createdDate,
            }
        })
        const response = await dynamoDb.send(putCommand);
        if (!response || response.$metadata.httpStatusCode !== 200) {
            return false;
        }
    }

    // 削除するタグの処理
    for (const tagId of Object.keys(deletedTags)) {
        console.log('Deleting tag#' + tagId);
        const deleteCommand = new DeleteCommand({
            TableName: templateTableName,
            Key: {
                'id': 'tag#' + tagId,
                'templateid': requestBody.templateid
            }
        });
        const response = await dynamoDb.send(deleteCommand);
        if (!response || response.$metadata.httpStatusCode !== 200) {
            return false;
        }
    }

    // タグテーブルの TempltateCount を更新
    await updateTemplateCount(deletedTags);
    await updateTemplateCount(updatedTags);

    return true
}

// handler
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // Log 出力
    console.log('Lambda event:' + JSON.stringify(event));

    try {
        // event から Request を生成する。
        const body = event.body ? JSON.parse(event.body) : {};
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
            id: body.id,
            templateid: body.templateid,
            title: body.title,
            prompt: body.prompt,
            public: body.public,
            usermailaddress: usermailaddress,
            tags: tags,
            createdDate: timestamp, // 更新時も日付を更新する
            gsi_pk: "userid",
            gsi_sk: userId + "#" + timestamp
        };

        console.log(requestBody);

        // Template を更新作成する
        const success = await updateTemplate(requestBody);

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
