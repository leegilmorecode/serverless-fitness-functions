import {
  MetricUnits,
  Metrics,
  logMetrics,
} from '@aws-lambda-powertools/metrics';
import { Tracer, captureLambdaHandler } from '@aws-lambda-powertools/tracer';
import { errorHandler, logger } from '@shared';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { injectLambdaContext } from '@aws-lambda-powertools/logger';
import { Session } from '@dto/session';
import middy from '@middy/core';
import { stopSessionUseCase } from '@use-cases/stop-session';

const tracer = new Tracer();
const metrics = new Metrics();

export const stopSessionAdapter = async ({
  pathParameters,
}: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const id = pathParameters?.id as string;

    // call the use case to stop the session
    const patched: Session = await stopSessionUseCase(id);

    metrics.addMetric('StopSessionSuccess', MetricUnits.Count, 1);

    return {
      statusCode: 200,
      body: JSON.stringify(patched),
    };
  } catch (error) {
    let errorMessage = 'Unknown error';
    if (error instanceof Error) errorMessage = error.message;
    logger.error(errorMessage);

    metrics.addMetric('StopSessionError', MetricUnits.Count, 1);

    return errorHandler(error);
  }
};

export const handler = middy(stopSessionAdapter)
  .use(injectLambdaContext(logger))
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics));
