import { config } from '@config';

const randomErrorBool = config.get('randomErrorBool') as string;

function stringToBool(value: string): boolean {
  return value.toLowerCase() === 'true';
}

export function randomError(): void {
  const randomCondition = Math.random() < 0.8;

  if (stringToBool(randomErrorBool) && randomCondition) {
    throw new Error('Random error occurred!');
  }
}
