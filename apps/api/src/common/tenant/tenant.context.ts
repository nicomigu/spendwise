import { AsyncLocalStorage } from 'async_hooks';

const storage = new AsyncLocalStorage<string>();

export const TenantContext = {
  get: (): string | undefined => storage.getStore(),
  run: <T>(organizationId: string, fn: () => T): T =>
    storage.run(organizationId, fn),
  clear: (): void => storage.enterWith(undefined as any),
};
