export class Worker {
  running: boolean;
  worker: WorkerType;
}

export enum WorkerType {
  NODE_STATUS,
  STAKING_INFO,
  ACCOUNT_BALANCE,
  HOT_BALANCE,
  COLD_BALANCE,
  HISTORY,
  HOT_HISTORY,
  COLD_HISTORY,
  XSERVER_INFO,
  GENERAL_INFO,
  UPDATE,
  COLD_TYPE,
  ADDRESS_BOOK,
  TX_CONFIRMATION,
}
