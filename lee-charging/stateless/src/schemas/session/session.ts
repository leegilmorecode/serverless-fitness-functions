export const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  properties: {
    id: {
      type: 'string',
    },
    status: {
      type: 'string',
      enum: ['SESSION_STARTED', 'SESSION_STOPPED'],
    },
    customerId: {
      type: 'string',
    },
    kilowattPrice: {
      type: 'number',
      minimum: 0,
    },
    sessionStartTime: {
      type: 'string',
    },
    sessionStopTime: {
      type: 'string',
    },
  },
  required: ['id', 'status', 'customerId', 'kilowattPrice', 'sessionStartTime'],
  additionalProperties: false,
};
