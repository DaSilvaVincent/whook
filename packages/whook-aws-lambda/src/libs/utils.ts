import { YError } from 'yerror';
import path from 'path';
import type { LogService } from 'common-services';

export async function loadLambda(
  {
    PROJECT_DIR,
    log,
  }: {
    PROJECT_DIR: string;
    log: LogService;
  },
  target: string,
  operationId: string,
  type: string,
  extension = '.mjs',
): Promise<any> {
  const modulePath = path.join(
    PROJECT_DIR,
    'builds',
    target,
    operationId,
    type + extension,
  );

  log('debug', `⛏️ - Loading lambda module at path "${modulePath}".`);

  try {
    const module = await import(modulePath);

    if (!module) {
      throw new YError('E_MODULE_NOT_FOUND', module);
    }

    if (!module.default) {
      throw new YError('E_LAMBDA_NOT_FOUND', module, Object.keys(module));
    }

    return module.default;
  } catch (err) {
    throw YError.wrap(err as Error, 'E_LAMBDA_LOAD');
  }
}
