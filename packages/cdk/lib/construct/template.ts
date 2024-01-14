import { Construct } from 'constructs';
import * as ddb from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import {
    Duration,
    Token,
    Arn,
    CustomResource,
    ResourceProps,
    CustomResourceProvider,
    CustomResourceProviderRuntime,
} from 'aws-cdk-lib';
import {
    AuthorizationType,
    CognitoUserPoolsAuthorizer,
    LambdaIntegration,
    RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { UserPool } from 'aws-cdk-lib/aws-cognito';
import api from '../../lambda/utils/api';

export interface TemplateProps {
    userPool: UserPool;
    api: RestApi;
    authorizer: CognitoUserPoolsAuthorizer;
}

/**
 * プロンプトのテンプレート管理機能を実行するためのリソースを作成する
 */
export class Template extends Construct {
    public readonly initDataFunctionName: string;

    constructor(scope: Construct, id: string, props: TemplateProps) {
        super(scope, id);

        // DynamoDB でテンプレートを管理するテーブルを作成
        const templateTable = new ddb.Table(this, 'TemplateTable', {
            partitionKey: {
                name: 'id',
                type: ddb.AttributeType.STRING,
            },
            sortKey: {
                name: 'templateid',
                type: ddb.AttributeType.STRING,
            },
        });

        // LSI の追加
        const createDateLSIname = 'CreatedDateIndex';
        templateTable.addLocalSecondaryIndex({
            indexName: createDateLSIname,
            sortKey: {
                name: 'createdDate',
                type: ddb.AttributeType.STRING,
            }
        });

        // LSI の追加
        const copyCountLSIname = 'CopyCountIndex';
        templateTable.addLocalSecondaryIndex({
            indexName: copyCountLSIname,
            sortKey: {
                name: 'copycount',
                type: ddb.AttributeType.NUMBER,
            }
        });

        // GSI の追加
        const gsiIndexName = 'GSIIndex'
        templateTable.addGlobalSecondaryIndex({
            indexName: gsiIndexName,
            partitionKey: {
                name: 'gsi_pk',
                type: ddb.AttributeType.STRING,
            },
            sortKey: {
                name: 'gsi_sk',
                type: ddb.AttributeType.STRING,
            }
        });

        // DynamoDB で Tag を管理するテーブルを作成
        const tagTable = new ddb.Table(this, 'TagTable', {
            partitionKey: {
                name: 'tagname',
                type: ddb.AttributeType.STRING,
            }
        });

        // templateCount を行うための GSI を追加
        const tagTableGsiIndexName = 'GSIIndex'
        tagTable.addGlobalSecondaryIndex({
            indexName: tagTableGsiIndexName,
            partitionKey: {
                name: 'gsi_pk',
                type: ddb.AttributeType.STRING,
            },
            sortKey: {
                name: 'gsi_sk',
                type: ddb.AttributeType.NUMBER,
            }
        });

        // tagid 列の GSI を追加
        const tagidGsiIndexName = 'GSIIndex_tagid'
        tagTable.addGlobalSecondaryIndex({
            indexName: tagidGsiIndexName,
            partitionKey: {
                name: 'tagid',
                type: ddb.AttributeType.STRING,
            }
        });

        // Tag を管理するテーブルに、初期データを作成するための Lambda 関数の作成 (タキヒヨー様向けなので、一般向けには利用しなくても良い)
        const initDataFunction = new NodejsFunction(this, 'InitDataLambda', {
            runtime: Runtime.NODEJS_18_X,
            entry: './lambda/initTemplateDatabase.ts',
            timeout: Duration.minutes(15),
            environment: {
                TABLE_NAME: tagTable.tableName
            },
        });
        tagTable.grantReadWriteData(initDataFunction);

        this.initDataFunctionName = initDataFunction.functionName;

        // マイテンプレート画面で、自分が作成したテンプレート一覧を取得する
        const getTemplateMyFunction = new NodejsFunction(this, 'getTemplateMy', {
            runtime: Runtime.NODEJS_18_X,
            entry: './lambda/getTemplateMy.ts',
            timeout: Duration.minutes(15),
            environment: {
                TEMPLATE_TABLE_NAME: templateTable.tableName,
                TAG_TABLE_NAME: tagTable.tableName,
                TEMPLATE_TABLE_GSI_INDEX_NAME: gsiIndexName,
            },
        });
        templateTable.grantReadWriteData(getTemplateMyFunction);
        tagTable.grantReadWriteData(getTemplateMyFunction);

        // テンプレートの新規作成関数
        const createTemplateFunction = new NodejsFunction(this, 'createTemplate', {
            runtime: Runtime.NODEJS_18_X,
            entry: './lambda/createTemplate.ts',
            timeout: Duration.minutes(15),
            environment: {
                TEMPLATE_TABLE_NAME: templateTable.tableName,
                TAG_TABLE_NAME: tagTable.tableName,
                TEMPLATE_TABLE_GSI_INDEX_NAME: gsiIndexName,
            },
        });
        templateTable.grantReadWriteData(createTemplateFunction);
        tagTable.grantReadWriteData(createTemplateFunction);

        // テンプレートの編集関数
        const updateTemplateFunction = new NodejsFunction(this, 'updateTemplate', {
            runtime: Runtime.NODEJS_18_X,
            entry: './lambda/updateTemplate.ts',
            timeout: Duration.minutes(15),
            environment: {
                TEMPLATE_TABLE_NAME: templateTable.tableName,
                TAG_TABLE_NAME: tagTable.tableName,
                TEMPLATE_TABLE_GSI_INDEX_NAME: gsiIndexName,
            },
        });
        templateTable.grantReadWriteData(updateTemplateFunction);
        tagTable.grantReadWriteData(updateTemplateFunction);

        // テンプレートの削除関数
        const deleteTemplateFunction = new NodejsFunction(this, 'deleteTemplate', {
            runtime: Runtime.NODEJS_18_X,
            entry: './lambda/deleteTemplate.ts',
            timeout: Duration.minutes(15),
            environment: {
                TEMPLATE_TABLE_NAME: templateTable.tableName,
                TAG_TABLE_NAME: tagTable.tableName,
                TEMPLATE_TABLE_GSI_INDEX_NAME: gsiIndexName,
            },
        });
        templateTable.grantReadWriteData(deleteTemplateFunction);
        tagTable.grantReadWriteData(deleteTemplateFunction);

        // タグの取得関数
        const getTagFunction = new NodejsFunction(this, 'getTamplateTags', {
            runtime: Runtime.NODEJS_18_X,
            entry: './lambda/getTamplateTags.ts',
            timeout: Duration.minutes(15),
            environment: {
                TEMPLATE_TABLE_NAME: templateTable.tableName,
                TAG_TABLE_NAME: tagTable.tableName,
                TAG_TABLE_GSI_INDEX_NAME: tagTableGsiIndexName,
            },
        });
        templateTable.grantReadWriteData(getTagFunction);
        tagTable.grantReadWriteData(getTagFunction);

        // タグの詳細取得関数
        const getTagDetailFunction = new NodejsFunction(this, 'getTagDetail', {
            runtime: Runtime.NODEJS_18_X,
            entry: './lambda/getTagDetail.ts',
            timeout: Duration.minutes(15),
            environment: {
                TEMPLATE_TABLE_NAME: templateTable.tableName,
                TAG_TABLE_NAME: tagTable.tableName,
                TAG_TABLE_GSI_TAGID_NAME: tagidGsiIndexName,
            },
        });
        templateTable.grantReadWriteData(getTagDetailFunction);
        tagTable.grantReadWriteData(getTagDetailFunction);

        // タグからテンプレート一覧を取得する関数
        const getTemplatesByTagFunction = new NodejsFunction(this, 'getTemplatesByTag', {
            runtime: Runtime.NODEJS_18_X,
            entry: './lambda/getTemplateByTag.ts',
            timeout: Duration.minutes(15),
            environment: {
                TEMPLATE_TABLE_NAME: templateTable.tableName,
                TAG_TABLE_NAME: tagTable.tableName,
                TEMPLATE_TABLE_COPYCOUNT_LSI_NAME: copyCountLSIname,
                TEMPLATE_TABLE_CREATEDDATE_LSI_NAME: createDateLSIname,
            },
        });
        templateTable.grantReadWriteData(getTemplatesByTagFunction);
        tagTable.grantReadWriteData(getTemplatesByTagFunction);

        // テンプレートの詳細を取得する関数
        const getTemplatesDetailFunction = new NodejsFunction(this, 'getTemplatesDetailFunction', {
            runtime: Runtime.NODEJS_18_X,
            entry: './lambda/getTemplateDetail.ts',
            timeout: Duration.minutes(15),
            environment: {
                TEMPLATE_TABLE_NAME: templateTable.tableName,
                TAG_TABLE_NAME: tagTable.tableName,
                TEMPLATE_TABLE_COPYCOUNT_LSI_NAME: copyCountLSIname,
                TEMPLATE_TABLE_CREATEDDATE_LSI_NAME: createDateLSIname,
            },
        });
        templateTable.grantReadWriteData(getTemplatesDetailFunction);
        tagTable.grantReadWriteData(getTemplatesDetailFunction);

        // テンプレートの copycount をカウントアップする関数
        const incrementTemplateCopycountFunction = new NodejsFunction(this, 'incrementTemplateCopycountFunction', {
            runtime: Runtime.NODEJS_18_X,
            entry: './lambda/incrementalTemplateCopycount.ts',
            timeout: Duration.minutes(15),
            environment: {
                TEMPLATE_TABLE_NAME: templateTable.tableName,
                TAG_TABLE_NAME: tagTable.tableName,
                TEMPLATE_TABLE_COPYCOUNT_LSI_NAME: copyCountLSIname,
                TEMPLATE_TABLE_CREATEDDATE_LSI_NAME: createDateLSIname,
            },
        });
        templateTable.grantReadWriteData(incrementTemplateCopycountFunction);
        tagTable.grantReadWriteData(incrementTemplateCopycountFunction);

        // TODO : CDK でカスタムリソースを定義して実行すると、想定通りに Lambda 関数が実行されるが、CloudFormation の Stack Status が CREATE_IN_PROGRESS のまま動かない。一旦、カスタムリソースは止めておく。
        // const customResourceResult = new CustomResource(
        //     this,
        //     'customResourceResult',
        //     {
        //         serviceToken: initDataFunction.functionArn,
        //     },
        // );

        // API Gateway に Template 管理用の API を設定
        const templatesResource = props.api.root.addResource('templates');

        // Cognito と連携した Authorizer を設定
        const commonAuthorizerProps = {
            authorizationType: AuthorizationType.COGNITO,
            authorizer: props.authorizer,
        };

        // マイテンプレート取得 API
        const templateMyResource = templatesResource.addResource('my');
        templateMyResource.addMethod(
            'GET',
            new LambdaIntegration(getTemplateMyFunction),
            {
                ...commonAuthorizerProps,
                requestParameters: {
                    'method.request.querystring.lastEvaluatedKey': false
                }
            }
        );

        // テンプレート新規作成
        const createResource = templatesResource.addResource('create');
        createResource.addMethod(
            'POST',
            new LambdaIntegration(createTemplateFunction),
            {
                ...commonAuthorizerProps,
            }
        );

        // テンプレート 初期データ作成作成 API
        const initdataResource = templatesResource.addResource('initdata');
        initdataResource.addMethod(
            'POST',
            new LambdaIntegration(initDataFunction),
            commonAuthorizerProps
        );

        // テンプレートの編集
        const templateResource = templatesResource.addResource('{templateId}');
        templateResource.addMethod(
            'PUT',
            new LambdaIntegration(updateTemplateFunction), 
            commonAuthorizerProps
        )

        templateResource.addMethod(
            'DELETE',
            new LambdaIntegration(deleteTemplateFunction),
            commonAuthorizerProps
        )

        templateResource.addMethod(
            'GET',
            new LambdaIntegration(getTemplatesDetailFunction),
            commonAuthorizerProps
        )

        // テンプレートの copycount を increment する
        const incrementCopycount = templateResource.addResource('increment-copycount');
        incrementCopycount.addMethod(
            'POST',
            new LambdaIntegration(incrementTemplateCopycountFunction),
            commonAuthorizerProps
        )

        // タグ一覧の取得
        const tagsResource = templatesResource.addResource('tags');
        tagsResource.addMethod(
            'GET',
            new LambdaIntegration(getTagFunction),
            {
                ...commonAuthorizerProps,
                requestParameters: {
                    'method.request.querystring.lastEvaluatedKey': false
                }
            }
        );

        // タグの詳細情報取得
        const tagDetailResource = tagsResource.addResource('{tagId}');
        tagDetailResource.addMethod(
            'GET',
            new LambdaIntegration(getTagDetailFunction),
            {
                ...commonAuthorizerProps,
            }
        );

        // タグからテンプレート一覧を取得する
        templatesResource.addMethod(
            'GET',
            new LambdaIntegration(getTemplatesByTagFunction),
            {
                ...commonAuthorizerProps,
                requestParameters: {
                    'method.request.querystring.tagid': true,
                    'method.request.querystring.sortby': true,
                    'method.request.querystring.lastEvaluatedKey': false,
                }
            }
        );
    }
}
