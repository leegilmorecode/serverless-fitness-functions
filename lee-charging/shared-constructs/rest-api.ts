import * as cdk from 'aws-cdk-lib';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';

import { Construct } from 'constructs';

interface ApiProps extends Pick<apigw.RestApiProps, 'description' | 'deploy'> {
  /**
   * The stage name which the api is being used with
   */
  stageName: string;
  /**
   * The api description
   */
  description: string;
  /**
   * Whether or not to deploy the api
   */
  deploy: boolean;
  /**
   * The latency threshold
   */
  latencyThreshold?: number;
}

type FixedApiProps = Omit<apigw.RestApiProps, 'description' | 'deploy'>;

export class Api extends Construct {
  public readonly api: apigw.RestApi;
  public readonly alarm: cloudwatch.Alarm;

  constructor(scope: Construct, id: string, props: ApiProps) {
    super(scope, id);

    const latencyThreshold = props.latencyThreshold
      ? props.latencyThreshold
      : 200;

    const fixedProps: FixedApiProps = {
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowCredentials: true,
        allowMethods: ['OPTIONS', 'POST', 'GET', 'PUT', 'DELETE', 'PATCH'],
        allowHeaders: ['*'],
      },
      endpointTypes: [apigw.EndpointType.REGIONAL],
      cloudWatchRole: true,
      retainDeployments: false,
      restApiName: `api-${props.stageName}`,
      disableExecuteApiEndpoint: false,
      deployOptions: {
        stageName: 'api',
        loggingLevel: apigw.MethodLoggingLevel.INFO,
        tracingEnabled: true,
        metricsEnabled: true,
        accessLogDestination: new apigw.LogGroupLogDestination(
          new logs.LogGroup(this, 'Logs' + id, {
            logGroupName: `ev-changing-api-logs-${props.stageName}`,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            retention: logs.RetentionDays.ONE_DAY,
          })
        ),
      },
    };

    this.api = new apigw.RestApi(this, id, {
      // fixed props
      ...fixedProps,
      // custom props
      description: props.description
        ? props.description
        : `API ${props.stageName}`,
      deploy: props.deploy ? props.deploy : true,
    });

    // create a cloudwatch alarm for Latency metric
    const latencyMetric = this.api.metricLatency({
      statistic: 'Average',
    });

    // create the alarm
    this.alarm = new cloudwatch.Alarm(this, id + 'LatencyAlarm', {
      alarmName: id + 'LatencyAlarm',
      alarmDescription: `Latency over ${latencyThreshold} ms limit alarm`,
      metric: latencyMetric,
      threshold: latencyThreshold,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    });
  }
}
