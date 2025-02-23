import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { autoService, name, singleton } from 'knifecycle';
import { noop } from '../libs/utils.js';
import { printStackTrace } from 'yerror';
import type { LogService } from 'common-services';

const DEFAULT_BASE_ENV = {};

/* Architecture Note #4: Environment service
The `ENV` service add a layer of configuration over just using
 node's `process.env` value. Beware that `PWD` and `NODE_ENV` are
 guaranteed to be the exact same than the injected constants.
 It is up to you to decide upstream if you set them via the
 `process.env.NODE_ENV` and `process.cwd()` values or not.
*/

export default singleton(name('ENV', autoService(initENV)));

export type ENVService = {
  [name: string]: string;
};
export type ENVConfig = {
  NODE_ENV?: string;
  PWD?: string;
  BASE_ENV?: ENVService;
  PROCESS_ENV?: ENVService;
};
export type ENVDependencies = ENVConfig & {
  NODE_ENV: string;
  PWD: string;
  log?: LogService;
  readFile?: typeof _readFile;
};

/**
 * Initialize the ENV service using process env plus dotenv files
 * @param  {Object}   services
 * The services ENV depends on
 * @param  {Object}   services.NODE_ENV
 * The injected NODE_ENV value to look for `.env.${NODE_ENV}` env file
 * @param  {Object}   services.PWD
 * The process current working directory
 * @param  {Object}   [services.BASE_ENV={}]
 * An optional base environment
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of an object containing the actual env vars.
 */
async function initENV({
  NODE_ENV,
  PWD,
  BASE_ENV = DEFAULT_BASE_ENV,
  PROCESS_ENV = process.env as ENVService,
  log = noop,
  readFile = _readFile,
}: ENVDependencies): Promise<ENVService> {
  let ENV = { ...BASE_ENV };

  log('debug', `♻️ - Loading the environment service.`);

  /* Architecture Note #4.1: Environment isolation
  Per default, Whook takes the process environment as is
   but since it could lead to leaks when building for
   AWS Lambda or Google Cloud Functions one can isolate
   the process env when building.
  */
  if (!process.env.ISOLATED_ENV) {
    ENV = { ...ENV, ...PROCESS_ENV };
    log('warning', `🖥 - Using local env.`);
  } else {
    log('warning', `🖥 - Using an isolated env.`);
  }

  /* Architecture Note #4.2: `.env.NODE_ENV` files
  You may need to keep some secrets out of your Git
   history. Whook uses `dotenv` to provide your such
   ability.
  */
  try {
    const envPath = path.join(PWD, `.env.${NODE_ENV}`);
    const buf = await readFile(envPath);
    const FILE_ENV = dotenv.parse(buf);

    log('warning', `💾 - Using .env file at "${envPath}".`);

    ENV = { ...ENV, ...FILE_ENV };
  } catch (err) {
    log('debug', `🚫 - Could not load ".env.${NODE_ENV}" file.`);
    log('debug-stack', printStackTrace(err));
  }

  return {
    ...ENV,
    PWD,
    NODE_ENV,
  };
}

async function _readFile(path: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    fs.readFile(path, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(data);
    });
  });
}
