export type CreateSession = {
  id?: string;
  status: 'SESSION_STARTED' | 'SESSION_STOPPED';
  customerId: string;
  kilowattPrice: number;
};
