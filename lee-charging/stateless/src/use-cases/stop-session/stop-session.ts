import { getSession, stopSession } from '@adapters/secondary/database-adapter';
import { getISOString, logger } from '@shared';

import { Session } from '@dto/session';
import { StopSession } from '@dto/stop-session/stop-session';
import { ResourceNotFoundError } from '@errors/resource-not-found';
import { createLatency } from 'stateless/src/shared/create-latency';
import { randomError } from 'stateless/src/shared/random-errors';

export async function stopSessionUseCase(id: string): Promise<Session> {
  // throw a random error is we have the env var set to true
  randomError();

  // add latency as a test if the env var is set to true
  await createLatency(1000);

  // stop the session
  const sessionStopTime = getISOString();

  const session: StopSession = {
    id,
    sessionStopTime,
  };

  await stopSession(session);

  logger.info(`session stopped for id ${session.id}`);

  // return the updated session
  const updatedSession = await getSession(id);

  if (!updatedSession)
    throw new ResourceNotFoundError(`session with id ${session.id} not found`);

  return updatedSession;
}
