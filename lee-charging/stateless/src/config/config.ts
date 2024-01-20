const convict = require('convict');

export const config = convict({
  tableName: {
    doc: 'The database table where we store sessions',
    format: String,
    default: 'tableName',
    env: 'TABLE_NAME',
  },
  randomErrorBool: {
    doc: 'Whether to throw random errors or not',
    format: String,
    default: 'true',
    env: 'RANDOM_ERROR',
  },
  createLatencyBool: {
    doc: 'Whether to add latency or not',
    format: String,
    default: 'true',
    env: 'LATENCY',
  },
}).validate({ allowed: 'strict' });
