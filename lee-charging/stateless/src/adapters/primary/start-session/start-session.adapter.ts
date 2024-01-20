import {
  MetricUnits,
  Metrics,
  logMetrics,
} from '@aws-lambda-powertools/metrics';
import { Tracer, captureLambdaHandler } from '@aws-lambda-powertools/tracer';
import { errorHandler, logger, schemaValidator } from '@shared';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { injectLambdaContext } from '@aws-lambda-powertools/logger';
import { CreateSession } from '@dto/create-session';
import { ValidationError } from '@errors/validation-error';
import middy from '@middy/core';
import { createSessionUseCase } from '@use-cases/create-session';
import { schema } from './start-session.schema';

const tracer = new Tracer();
const metrics = new Metrics();

export const startSessionAdapter = async ({
  body,
}: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!body) throw new ValidationError('no payload body');

    const session = JSON.parse(body) as CreateSession;

    schemaValidator(schema, session);

    const created: CreateSession = await createSessionUseCase(session);

    metrics.addMetric('StartSessionSuccess', MetricUnits.Count, 1);

    return {
      statusCode: 201,
      body: JSON.stringify(created),
    };
  } catch (error) {
    let errorMessage = 'Unknown error';
    if (error instanceof Error) errorMessage = error.message;
    logger.error(errorMessage);

    metrics.addMetric('StartSessionError', MetricUnits.Count, 1);

    return errorHandler(error);
  }
};

export const handler = middy(startSessionAdapter)
  .use(injectLambdaContext(logger))
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics));
