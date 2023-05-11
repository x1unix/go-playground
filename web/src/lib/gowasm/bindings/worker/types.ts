export interface Worker {
  exit()
}

export interface WorkerListener<T extends Worker> {
  onWorkerRegister(worker: T)
}
