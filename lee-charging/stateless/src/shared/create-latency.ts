import { config } from '@config';

const latencyBool = config.get('createLatencyBool') as string;

function stringToBool(value: string): boolean {
  return value.toLowerCase() === 'true';
}

export async function createLatency(ms: number): Promise<void> {
  if (stringToBool(latencyBool)) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}
