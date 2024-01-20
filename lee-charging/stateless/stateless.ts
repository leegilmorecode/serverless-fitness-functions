import * as cdk from 'aws-cdk-lib';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as codeDeploy from 'aws-cdk-lib/aws-codedeploy';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as path from 'path';

import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import {
  ProgressiveLambdaRule,
  RequiredTagsChecker,
  Tags,
  addTagsToStack,
  requiredTags,
} from '../infra-common';
import { Api, ProgressiveLambda } from '../shared-constructs';

import { Construct } from 'constructs';
import { supressions } from './stateless.supressions';

interface LeeChargingStatelessStackProps extends cdk.StackProps {
  table: dynamodb.Table;
}

export class LeeChargingStatelessStack extends cdk.Stack {
  private table: dynamodb.Table;

  constructor(
    scope: Construct,
    id: string,
    props: LeeChargingStatelessStackProps
  ) {
    super(scope, id, props);

    this.table = props.table;

    // constants
    const powerToolServiceName = 'ev-charging';
    const powerToolsMetricsNamespace = 'lee-ev-charging';
    const canaryNotificationEmail = 'your.email@gmail.com';

    // we add the tags for the stack
    const tags: Tags = {
      'ev:operations:StackId': 'Stateless',
      'ev:operations:ServiceId': 'EV',
      'ev:operations:ApplicationId': 'Api',
      'ev:cost-allocation:Owner': 'Lee',
      'ev:cost-allocation:ApplicationId': 'Api',
    };

    const lambdaPowerToolsConfig = {
      LOG_LEVEL: 'DEBUG',
      POWERTOOLS_LOGGER_LOG_EVENT: 'true',
      POWERTOOLS_LOGGER_SAMPLE_RATE: '1',
      POWERTOOLS_TRACE_ENABLED: 'enabled',
      POWERTOOLS_TRACER_CAPTURE_HTTPS_REQUESTS: 'captureHTTPsRequests',
      POWERTOOLS_SERVICE_NAME: powerToolServiceName,
      POWERTOOLS_TRACER_CAPTURE_RESPONSE: 'captureResult',
      POWERTOOLS_METRICS_NAMESPACE: powerToolsMetricsNamespace,
    };

    // sns topic to allow us to alert on failure
    const lambdaDeploymentTopic: sns.Topic = new sns.Topic(
      this,
      'LambdaDeploymentTopic',
      {
        displayName: 'EV Charging Lambda Deployment Topic',
        topicName: 'EVChargingLambdaDeploymentTopic',
      }
    );
    lambdaDeploymentTopic.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // the code deploy application for the progressive deployments
    const application = new codeDeploy.LambdaApplication(
      this,
      'CodeDeployApplication',
      {
        applicationName: 'ev-charging-application',
      }
    );

    // our progressive canary lambda for deployments
    const { alias: startChargingLambdaAlias, lambda: startChargingLambda } =
      new ProgressiveLambda(this, 'StartChargingLambda', {
        functionName: 'start-charging-lambda',
        description: 'A function to start the charging session',
        stageName: 'prod',
        serviceName: powerToolServiceName,
        metricName: 'StartSessionError',
        namespace: powerToolsMetricsNamespace,
        tracing: lambda.Tracing.ACTIVE,
        logRetention: logs.RetentionDays.ONE_DAY,
        architecture: lambda.Architecture.ARM_64,
        application,
        alarmEnabed: true,
        snsTopic: lambdaDeploymentTopic,
        timeout: cdk.Duration.seconds(10),
        retryAttempts: 0,
        deploymentConfig: codeDeploy.LambdaDeploymentConfig.ALL_AT_ONCE,
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(
          __dirname,
          'src/adapters/primary/start-session/start-session.adapter.ts'
        ),
        memorySize: 1024,
        handler: 'handler',
        bundling: {
          minify: true,
          sourceMap: true,
          externalModules: ['@aws-sdk/*'],
        },
        environment: {
          TABLE_NAME: this.table.tableName,
          RANDOM_ERROR: 'false',
          LATENCY: 'true',
          ...lambdaPowerToolsConfig,
        },
      });

    // our progressive canary lambda for deployments
    const { alias: stopChargingLambdaAlias, lambda: stopChargingLambda } =
      new ProgressiveLambda(this, 'StopChargingLambda', {
        functionName: 'stop-charging-lambda',
        description: 'A function to stop the charging session',
        stageName: 'prod',
        serviceName: powerToolServiceName,
        metricName: 'StopSessionError',
        namespace: powerToolsMetricsNamespace,
        tracing: lambda.Tracing.ACTIVE,
        logRetention: logs.RetentionDays.ONE_DAY,
        architecture: lambda.Architecture.ARM_64,
        application,
        alarmEnabed: true,
        snsTopic: lambdaDeploymentTopic,
        timeout: cdk.Duration.seconds(10),
        retryAttempts: 0,
        deploymentConfig: codeDeploy.LambdaDeploymentConfig.ALL_AT_ONCE,
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(
          __dirname,
          'src/adapters/primary/stop-session/stop-session.adapter.ts'
        ),
        memorySize: 1024,
        handler: 'handler',
        bundling: {
          minify: true,
          sourceMap: true,
          externalModules: ['@aws-sdk/*'],
        },
        environment: {
          TABLE_NAME: this.table.tableName,
          RANDOM_ERROR: 'false',
          LATENCY: 'true',
          ...lambdaPowerToolsConfig,
        },
      });

    // grant table permissions for the lambda functions
    this.table.grantReadWriteData(stopChargingLambda);
    this.table.grantReadWriteData(startChargingLambda);

    // create the subscription on the sns topic to send the email
    const lambdaDeploymentSubscriptions = lambdaDeploymentTopic.addSubscription(
      new subscriptions.EmailSubscription(canaryNotificationEmail)
    );
    lambdaDeploymentSubscriptions.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // create the api for the charging endpoints
    const api: apigw.RestApi = new Api(this, 'Api', {
      description: 'An api for ev charging',
      stageName: 'prod',
      deploy: true,
    }).api;

    const apiVersion: apigw.Resource = api.root.addResource('v1');
    const sessions: apigw.Resource = apiVersion.addResource('sessions');
    const session: apigw.Resource = sessions.addResource('{id}');

    // hook up the lambda functions to the api
    sessions.addMethod(
      'POST',
      new apigw.LambdaIntegration(startChargingLambdaAlias, {
        proxy: true,
      })
    );

    session.addMethod(
      'PATCH',
      new apigw.LambdaIntegration(stopChargingLambdaAlias, {
        proxy: true,
      })
    );

    // add the tags to all constructs in the stack
    // note: stack level tags apply to all supported resources by default
    addTagsToStack(this, tags);

    // for compliance ensure we have the required tags added to the stack
    cdk.Aspects.of(this).add(new RequiredTagsChecker(requiredTags));

    // ensure that we only use our progressive lambda function and not NodeJsFunction
    cdk.Aspects.of(this).add(new ProgressiveLambdaRule());

    // cdk nag check and suppressions to ensure compliance to best practices
    cdk.Aspects.of(this).add(new AwsSolutionsChecks({ verbose: false }));
    NagSuppressions.addStackSuppressions(this, [...supressions], true);
  }
}
