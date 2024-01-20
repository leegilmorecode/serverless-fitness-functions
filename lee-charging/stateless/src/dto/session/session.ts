export type Session = {
  id: string;
  status: 'SESSION_STARTED' | 'SESSION_STOPPED';
  customerId: string;
  kilowattPrice: number;
  sessionStartTime: string;
  sessionStopTime?: string;
};
