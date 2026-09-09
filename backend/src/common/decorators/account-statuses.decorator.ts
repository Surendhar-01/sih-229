import { SetMetadata } from '@nestjs/common';

export const ACCOUNT_STATUSES_KEY = 'account_statuses';
export const AllowedAccountStatuses = (...statuses: string[]) =>
  SetMetadata(ACCOUNT_STATUSES_KEY, statuses);
