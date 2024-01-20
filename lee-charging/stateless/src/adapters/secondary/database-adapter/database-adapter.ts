import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

import { config } from '@config';
import { Session } from '@dto/session';
import { StopSession } from '@dto/stop-session/stop-session';
import { logger } from '@shared';

const dynamoDb = new DynamoDBClient({});
const tableName = config.get('tableName');

export async function startSession(session: Session): Promise<Session> {
  const params = {
    TableName: tableName,
    Item: marshall(session),
  };

  try {
    await dynamoDb.send(new PutItemCommand(params));

    logger.info(`session created with id ${session.id} into ${tableName}`);

    return session;
  } catch (error) {
    console.error('error creating session:', error);
    throw error;
  }
}

export async function stopSession(session: StopSession): Promise<void> {
  const { id, sessionStopTime } = session;

  const updateParams = {
    TableName: tableName,
    Key: marshall({ id }),
    UpdateExpression: 'SET #status = :status, #stopTime = :stopTime',
    ExpressionAttributeNames: {
      '#status': 'status',
      '#stopTime': 'sessionStopTime',
    },
    ExpressionAttributeValues: marshall({
      ':status': 'SESSION_STOPPED',
      ':stopTime': sessionStopTime,
    }),
  };

  try {
    await dynamoDb.send(new UpdateItemCommand(updateParams));

    logger.info(`session with id ${id} stopped in ${tableName}`);
  } catch (error) {
    console.error('error stopping session:', error);
    throw error;
  }
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const getParams = {
    TableName: tableName,
    Key: marshall({ id: sessionId }),
  };

  try {
    const response = await dynamoDb.send(new GetItemCommand(getParams));

    if (!response.Item) {
      logger.info(`session with id ${sessionId} not found in ${tableName}`);
      return null;
    }

    const session = unmarshall(response.Item) as Session;
    logger.info(`session with id ${sessionId} retrieved from ${tableName}`);
    return session;
  } catch (error) {
    console.error('error getting session:', error);
    throw error;
  }
}
