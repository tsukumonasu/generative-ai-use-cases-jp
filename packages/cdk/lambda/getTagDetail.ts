import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, DeleteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient();
const dynamoDb = DynamoDBDocumentClient.from(client);

interface ResponseType {
    tagname?: string,
    tagid?: string,
    gsi_pk?: string,
    gsi_sk?: number,
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // Log 出力
    console.log('Lambda event:' + JSON.stringify(event));

    const tableName: string = process.env.TAG_TABLE_NAME!;
    const indexName: string = process.env.TAG_TABLE_GSI_TAGID_NAME!;

    try {
        const tagid = event.pathParameters?.tagId ? event.pathParameters.tagId : "";

        const queryParams = {
            TableName: tableName,
            IndexName: indexName,
            KeyConditionExpression: 'tagid = :tagid',
            ExpressionAttributeValues: {
                ':tagid': tagid
            }
        };

        const queryResult = await dynamoDb.send(new QueryCommand(queryParams));
        const response = queryResult.Items as ResponseType[];

        let body = {};
        if (response[0]) {
            body = response[0];
        }

        // Log 出力
        console.log('Lambda return:' + JSON.stringify(body));

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify(body),
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
