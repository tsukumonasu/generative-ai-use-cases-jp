import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient();
const dynamoDb = DynamoDBDocumentClient.from(client);

interface Template {
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

interface URLParameters {
    tagid: string;
    sortBy: 'createdDate' | 'copycount',
    LastEvaluatedKey?: {
        [key: string]: string;
    };
}

interface Response {
    items: Template[],
    LastEvaluatedKey?: {
        [key: string]: string;
    };
}

async function getTemplatesByTag(parameters: URLParameters): Promise<Response> {
    const tamplateTableName: string = process.env.TEMPLATE_TABLE_NAME!;
    const copycountLSIName: string = process.env.TEMPLATE_TABLE_COPYCOUNT_LSI_NAME!;
    const createddateLSIName: string = process.env.TEMPLATE_TABLE_CREATEDDATE_LSI_NAME!;


    const queryCommand = new QueryCommand({
        TableName: tamplateTableName,
        IndexName: parameters.sortBy === 'createdDate' ? createddateLSIName : copycountLSIName,
        KeyConditionExpression: 'id = :id',
        ExpressionAttributeValues: {
            ':id': 'tag#' + parameters.tagid,
        },
        ScanIndexForward: false,
        Limit: parameters.sortBy === 'createdDate' ? 10 : 3,
    });

    if (parameters.LastEvaluatedKey) {
        queryCommand.input.ExclusiveStartKey = parameters.LastEvaluatedKey;
    }

    console.log("QueryCommand : " + JSON.stringify(queryCommand));

    try {
        // Tag に紐づく Template id の一覧を取得
        const { Items, LastEvaluatedKey } = await dynamoDb.send(queryCommand);

        // Items が 0 件の場合は空の配列を返す
        if (!Items || Items.length === 0) {
            return {
                items: [],
                LastEvaluatedKey: LastEvaluatedKey as { [key: string]: string; }
            };
        }

        // Template id を使って、Template の詳細情報を取得
        // BatchGetItem を使用して複数のテンプレートを取得
        const templateIds = (Items as Template[]).map(item => item.templateid);

        const keys = templateIds.map((templateid: string) => ({
            id: 'template#' + templateid,
            templateid: templateid
        }));

        const batchGetCommand = new BatchGetCommand({
            RequestItems: {
                [tamplateTableName]: {
                    Keys: keys
                }
            }
        });

        const { Responses } = await dynamoDb.send(batchGetCommand);
        const templates: Template[] = Responses ? Responses[tamplateTableName].map((item: any) => {
            // DynamoDBから取得したデータをTemplate型にキャストする
            return item as Template;
        }) : [];

        // Sort the templates array to match the order of Items
        const sortedTemplates = templates.sort((a: Template, b: Template) => {
            return templateIds.indexOf(a.templateid) - templateIds.indexOf(b.templateid);
        });

        return {
            items: sortedTemplates as Template[],
            LastEvaluatedKey: LastEvaluatedKey as { [key: string]: string; }
        };
    } catch (error) {
        console.error("Error executing query: ", error);
        throw error;
    }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // Log 出力
    console.log('Lambda event:' + JSON.stringify(event));


    // GET の URL パラメーターから、tag パラメータを取得する
    let tagid = "";
    if (event.queryStringParameters && event.queryStringParameters.tag) {
        tagid = event.queryStringParameters.tag;
    }

    // GET の URL パラメーターから、sortby パラメータを取得する
    let sortby = null;
    if (event.queryStringParameters && event.queryStringParameters.sortby) {
        sortby = event.queryStringParameters.sortby;
    }

    // GET の URL パラメーターから、lastEvaluatedKey があれば取得する。ページ機能に利用する。
    let lastEvaluatedKey = null;
    if (event.queryStringParameters && event.queryStringParameters.lastEvaluatedKey) {
        lastEvaluatedKey = JSON.parse(decodeURIComponent(atob(event.queryStringParameters.lastEvaluatedKey)));
    }

    const parameters: URLParameters = {
        tagid: tagid,
        sortBy: sortby as 'createdDate' | 'copycount',
        LastEvaluatedKey: lastEvaluatedKey
    };

    try {
        const response = await getTemplatesByTag(parameters);

        console.log(response);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify(response),
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
