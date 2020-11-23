export class Worker {
  running: boolean;
  worker: WorkerType;
}

export enum WorkerType {
  NODE_STATUS,
  STAKING_INFO,
  ACCOUNT_BALANCE,
  ACCOUNT_MAX_BALANCE,
  HOT_BALANCE,
  COLD_BALANCE,
  HISTORY,
  HOT_HISTORY,
  COLD_HISTORY,
  XSERVER_INFO,
  GENERAL_INFO,
  ADDRESS_BOOK,
  TX_CONFIRMATION,
}
