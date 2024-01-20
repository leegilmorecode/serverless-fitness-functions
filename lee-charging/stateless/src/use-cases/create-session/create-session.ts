import { getISOString, logger, schemaValidator } from '@shared';

import { startSession } from '@adapters/secondary/database-adapter';
import { CreateSession } from '@dto/create-session';
import { Session } from '@dto/session';
import { schema } from '@schemas/session';
import { createLatency } from 'stateless/src/shared/create-latency';
import { randomError } from 'stateless/src/shared/random-errors';
import { v4 as uuid } from 'uuid';

export async function createSessionUseCase(
  newSession: CreateSession
): Promise<Session> {
  // throw a random error is we have the env var set to true
  randomError();

  // add latency as a test if the env var is set to true
  await createLatency(1000);

  // start the session
  const sessionStartTime = getISOString();

  const session: Session = {
    id: uuid(),
    sessionStartTime,
    ...newSession,
  };

  schemaValidator(schema, session);

  await startSession(session);

  logger.info(`session created for id ${session.id}`);

  return session;
}
