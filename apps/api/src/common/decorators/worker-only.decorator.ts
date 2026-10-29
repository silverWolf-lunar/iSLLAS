import { SetMetadata } from '@nestjs/common';

export const WORKER_ONLY_KEY = 'workerOnly';
export const WorkerOnly = () => SetMetadata(WORKER_ONLY_KEY, true);