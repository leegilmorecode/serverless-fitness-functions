export const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  properties: {
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
  },
  required: ['status', 'customerId', 'kilowattPrice'],
  additionalProperties: false,
};
