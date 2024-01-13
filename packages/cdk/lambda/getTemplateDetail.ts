import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient();
const dynamoDb = DynamoDBDocumentClient.from(client);

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // Log 出力
    console.log('Lambda event:' + JSON.stringify(event));

    const tableName: string = process.env.TEMPLATE_TABLE_NAME!;

    try {
        const templateId = event.pathParameters?.templateId ? event.pathParameters.templateId : "";

        const queryParams = {
            TableName: tableName,
            KeyConditionExpression: 'id = :id and templateid = :templateId',
            ExpressionAttributeValues: {
                ':id': `template#${templateId}`,
                ':templateId': templateId
            }
        };

        const queryResult = await dynamoDb.send(new QueryCommand(queryParams));
        let templateDetails;

        if (queryResult.Items && queryResult.Items.length > 0) {
            templateDetails = queryResult.Items[0];
        } else {
            templateDetails = {};
        }

        console.log(templateDetails);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify(templateDetails),
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
