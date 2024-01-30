export interface Worker {
  exit: () => any
}

export interface WorkerListener<T extends Worker> {
  onWorkerRegister: (worker: T) => any
}
