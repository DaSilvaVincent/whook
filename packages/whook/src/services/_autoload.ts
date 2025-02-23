import { identity, noop, compose } from '../libs/utils.js';
import {
  constant,
  name,
  autoService,
  singleton,
  initializer,
} from 'knifecycle';
import { getOpenAPIOperations } from '@whook/http-router';
import path from 'path';
import { YError } from 'yerror';
import type {
  Injector,
  Autoloader,
  ProviderInitializer,
  Initializer,
  Dependencies,
  Service,
} from 'knifecycle';
import type { CONFIGSService } from './CONFIGS.js';
import type {
  ResolveService,
  ImporterService,
  LogService,
} from 'common-services';
import type { WhookHandler } from '@whook/http-transaction';

export const HANDLER_REG_EXP =
  /^(head|get|put|post|delete|options|handle)[A-Z][a-zA-Z0-9]+/;

export interface WhookWrapper<D extends Dependencies, S extends WhookHandler> {
  (initializer: Initializer<S, D>): Initializer<S, D>;
}
/* Architecture Note #5.7.1: WhookServiceMap
Whook exports a `WhookServiceMap` type to help you ensure yours are valid.
*/
export type WhookServiceMap = { [name: string]: string };
/* Architecture Note #5.6.1: WhookInitializerMap
Whook exports a `WhookInitializerMap` type to help you ensure yours are valid.
*/
export type WhookInitializerMap = { [name: string]: string };

export type AutoloadConfig = {
  WHOOK_PLUGINS_PATHS?: string[];
  SERVICE_NAME_MAP?: WhookServiceMap;
  INITIALIZER_PATH_MAP?: WhookInitializerMap;
  PROJECT_SRC?: string;
};
export type AutoloadDependencies<D extends Dependencies> = AutoloadConfig & {
  PROJECT_SRC: string;
  CONFIGS?: CONFIGSService;
  WRAPPERS?: WhookWrapper<D, WhookHandler>[];
  $injector: Injector<Service>;
  importer: ImporterService<{
    default: Initializer<Service, Dependencies>;
  }>;
  resolve: ResolveService;
  log?: LogService;
};

/* Architecture Note #5: `$autoload` service
The default Whook autoloader provides a simple way to
 load the constants, services and handlers of a Whook
 project automatically from the installed whook plugins.
*/
export default singleton(name('$autoload', autoService(initAutoload)));

/**
 * Initialize the Whook default DI autoloader
 * @param  {Object}   services
 * The services `$autoload` depends on
 * @param  {Object}   services.PROJECT_SRC
 * The project source directory
 * @param  {Object}   services.WHOOK_PLUGINS_PATHS
 * The plugins paths to load services from
 * @param  {Object}   services.$injector
 * An injector for internal dynamic services loading
 * @param  {Object}   [services.SERVICE_NAME_MAP={}]
 * An optional object to map services names to other names
 * @param  {Object}   [services.INITIALIZER_PATH_MAP={}]
 * An optional object to map non-autoloadable initializers
 * @param  {Array}    [services.WRAPPERS]
 * An optional list of wrappers to inject
 * @param  {Array}    [services.CONFIGS]
 * Optional CONFIGS object to inject
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @param  {Object}   services.importer
 * A service allowing to dynamically import ES modules
 * @return {Promise<Function>}
 * A promise of the autoload function.
 */
async function initAutoload<D extends Dependencies>({
  PROJECT_SRC,
  WHOOK_PLUGINS_PATHS = [],
  $injector,
  SERVICE_NAME_MAP = undefined,
  INITIALIZER_PATH_MAP = undefined,
  WRAPPERS = undefined,
  CONFIGS = undefined,
  log = noop,
  importer,
  resolve,
}: AutoloadDependencies<D>): Promise<
  Autoloader<Initializer<unknown, Dependencies>>
> {
  log('debug', '🤖 - Initializing the `$autoload` service.');

  // Here to allow DI auto-detection since {} causes errors
  INITIALIZER_PATH_MAP = INITIALIZER_PATH_MAP || {};

  /* Architecture Note #5.3: API auto loading
  We cannot inject the `API` in the auto loader since
   it is dynamically loaded so doing this during the auto
   loader initialization.
  */
  let API;
  const getAPI = (() => {
    return async () => {
      if (!API) {
        // eslint-disable-next-line
        API = (await $injector(['API'])).API;
      }
      return API;
    };
  })();

  /* Architecture Note #5.2: Wrappers auto loading support
  We cannot inject the `WRAPPERS` in the auto loader when
   it is dynamically loaded so giving a second chance here
   for `WRAPPERS` to be set.
  */
  const doWrapHandler = ((WRAPPERS) => {
    let wrapHandler;

    return async (handlerInitializer) => {
      if (!WRAPPERS) {
        // eslint-disable-next-line
        WRAPPERS = (await $injector(['WRAPPERS'])).WRAPPERS || [];
      }
      wrapHandler =
        wrapHandler ||
        (WRAPPERS?.length ? compose(...(WRAPPERS as any[])) : identity);

      return wrapHandler(handlerInitializer);
    };
  })(WRAPPERS);

  const mapInjectedName = async (injectedName) => {
    if ('SERVICE_NAME_MAP' === injectedName) {
      return injectedName;
    }
    if (!SERVICE_NAME_MAP) {
      // eslint-disable-next-line
      SERVICE_NAME_MAP = (await $injector(['SERVICE_NAME_MAP']))
        .SERVICE_NAME_MAP;
    }

    return SERVICE_NAME_MAP?.[injectedName] || injectedName;
  };

  return $autoload;

  /**
   * Autoload an initializer from its name
   * @param  {String}  The dependency name
   * @return {Promise<Object>}
   * A promise resolving whith the actual autoloader definition.
   *  An Object containing the `path`, `name` and the `initializer`
   *  in its properties.
   */
  async function $autoload(injectedName: string): Promise<{
    name: string;
    path: string;
    initializer: Initializer<Service, Dependencies>;
  }> {
    /* Architecture Note #5.7: Service name mapping
    In order to be able to substituate easily a service per another
     one can specify a mapping between a service and its substitution.
    */
    const resolvedName = await mapInjectedName(injectedName);

    if (resolvedName !== injectedName) {
      log(
        'debug',
        `📖 - Using SERVICE_NAME_MAP to route "${injectedName}" to "${resolvedName}".`,
      );
    }

    /* Architecture Note #5.1: Configuration auto loading
    Loading the configuration files is done according to the `NODE_ENV`
     environment variable. It basically requires a configuration hash
     where the keys are Knifecycle constants.

    Let's load the configuration files as a convenient way
     to create constants on the fly
    */
    if ('CONFIGS' !== resolvedName) {
      if (!CONFIGS) {
        // eslint-disable-next-line
        CONFIGS = (await $injector(['CONFIGS'])).CONFIGS;
      }
    }

    /* Architecture Note #5.4: Constants
    First of all the autoloader looks for constants in the
     previously loaded `CONFIGS` configurations hash.
    */
    if (CONFIGS && CONFIGS[resolvedName]) {
      return {
        name: resolvedName,
        path: 'internal://' + resolvedName,
        initializer: constant(
          resolvedName,
          CONFIGS[resolvedName],
        ) as Initializer<Service, Dependencies>,
      };
    }

    const isHandler = HANDLER_REG_EXP.test(resolvedName);
    const isWrappedHandler = resolvedName.endsWith('Wrapped');

    /* Architecture Note #5.5: Handlers map
    Here, we build the handlers map needed by the router by injecting every
     handler required by the API.
    */
    if ('HANDLERS' === resolvedName) {
      const handlerNames = [
        ...new Set(
          (await getOpenAPIOperations(await getAPI())).map(
            (operation) => operation.operationId,
          ),
        ),
      ].map((handlerName) => `${handlerName}>${handlerName}Wrapped`);

      return {
        name: resolvedName,
        initializer: initializer(
          {
            name: 'HANDLERS',
            inject: handlerNames,
            type: 'service',
            singleton: true,
          },
          async (HANDLERS) => HANDLERS,
        ),
        path: 'internal://' + resolvedName,
      };
    }

    /* Architecture Note #5.6: Service/handler loading
    Finally, we either require the handler/service module if
     none of the previous strategies applyed.
    */
    const modulePath = (
      INITIALIZER_PATH_MAP?.[resolvedName]
        ? resolve(INITIALIZER_PATH_MAP[resolvedName])
        : [PROJECT_SRC, ...WHOOK_PLUGINS_PATHS].reduce(
            (finalModulePath, basePath) => {
              if (finalModulePath) {
                return finalModulePath;
              }

              const finalPath = path.join(
                basePath,
                isHandler ? 'handlers' : 'services',
                isWrappedHandler
                  ? resolvedName.replace(/Wrapped$/, '')
                  : resolvedName,
              );

              try {
                return resolve(finalPath);
              } catch (err) {
                log(
                  'debug',
                  `🚫 - Service "${resolvedName}" not found in "${finalPath}".`,
                );
                return '';
              }
            },
            '',
          )
    ).replace(/^\.js/, '');

    /* Architecture Note #5.8: Initializer path mapping
    In order to be able to load a service from a given path map
     one can directly specify a path to use for its resolution.
    */
    if (INITIALIZER_PATH_MAP?.[resolvedName]) {
      log(
        'debug',
        `📖 - Using INITIALIZER_PATH_MAP to resolve the "${resolvedName}" module path.`,
      );
    }

    if (!modulePath) {
      throw new YError('E_UNMATCHED_DEPENDENCY', resolvedName);
    }

    log('debug', `💿 - Service "${resolvedName}" found in "${modulePath}".`);

    const resolvedInitializer = (await importer(modulePath)).default;

    log(
      'debug',
      `💿 - Loading "${injectedName}" initializer${
        resolvedName !== injectedName ? ` via "${resolvedName}" resolution` : ''
      } from "${modulePath}".`,
    );

    return {
      name: resolvedName,
      path: modulePath,
      initializer: isWrappedHandler
        ? name(resolvedName, await doWrapHandler(resolvedInitializer))
        : injectedName !== resolvedName
        ? name(
            injectedName,
            resolvedInitializer as ProviderInitializer<Dependencies, Service>,
          )
        : resolvedInitializer,
    };
  }
}
