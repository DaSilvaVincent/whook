import { Knifecycle, constant } from 'knifecycle';
import debug from 'debug';
import { printStackTrace } from 'yerror';
import { noop, identity, compose, pipe } from './libs/utils.js';
import {
  COMPONENTS_TYPES,
  cleanupOpenAPI,
  collectRefs,
  refersTo,
} from './libs/openapi.js';
import { mergeVaryHeaders, lowerCaseHeaders } from './libs/headers.js';
import {
  initLogService,
  initTimeService,
  initRandomService,
  initDelayService,
  initProcessService,
  initResolveService,
  initImporterService,
  DEFAULT_LOG_ROUTING,
  DEFAULT_LOG_CONFIG,
} from 'common-services';
import initHTTPRouter, {
  OPEN_API_METHODS,
  DEFAULT_ERROR_URI,
  DEFAULT_HELP_URI,
  DEFAULT_ERRORS_DESCRIPTORS,
  DEFAULT_DEFAULT_ERROR_CODE,
  initErrorHandler,
} from '@whook/http-router';
import initHTTPTransaction, {
  initObfuscatorService,
  initAPMService,
} from '@whook/http-transaction';
import initHTTPServer from '@whook/http-server';
import initPort from './services/PORT.js';
import initHost from './services/HOST.js';
import initEnv from './services/ENV.js';
import initProxyedENV from './services/ProxyedENV.js';
import initBuildConstants from './services/BUILD_CONSTANTS.js';
import initConfigs from './services/CONFIGS.js';
import initProjectDir from './services/PROJECT_DIR.js';
import initWhookPluginsPaths from './services/WHOOK_PLUGINS_PATHS.js';
import initAPIDefinitions, {
  DEFAULT_IGNORED_FILES_PREFIXES,
  DEFAULT_IGNORED_FILES_SUFFIXES,
  DEFAULT_REDUCED_FILES_SUFFIXES,
  WhookAPIDefinitionsConfig,
} from './services/API_DEFINITIONS.js';
import initAutoload, { HANDLER_REG_EXP } from './services/_autoload.js';
import initGetPing, {
  definition as initGetPingDefinition,
} from './handlers/getPing.js';
import { runREPL } from './repl.js';
import {
  DEFAULT_BUILD_INITIALIZER_PATH_MAP,
  prepareBuildEnvironment,
  runBuild,
} from './build.js';
import runCLI from './cli.js';
import { readArgs } from './libs/args.js';
import type { WhookCommandArgs } from './services/args.js';
import type {
  WhookArgsTypes,
  WhookCommandHandler,
  WhookCommandDefinition,
  PromptArgs,
} from './services/promptArgs.js';
import type { PortEnv } from './services/PORT.js';
import type { LogService } from 'common-services';
import type {
  HTTPServerConfig,
  HTTPServerProvider,
  HTTPServerService,
  HTTPServerEnv,
} from '@whook/http-server';
import type { HostEnv } from './services/HOST.js';
import type { ENVConfig, ENVService } from './services/ENV.js';
import type { ProxyedENVConfig } from './services/ProxyedENV.js';
import type { WhookBuildConstantsService } from './services/BUILD_CONSTANTS.js';
import type {
  CONFIGSService,
  WhookConfig,
  CONFIGSConfig,
} from './services/CONFIGS.js';
import type {
  WhookPluginsService,
  WhookPluginsPathsService,
  WhookPluginsPathsConfig,
} from './services/WHOOK_PLUGINS_PATHS.js';
import type {
  WhookAPIDefinitions,
  WhookAPIOperationAddition,
  WhookAPIOperationConfig,
  WhookAPIOperation,
  WhookBaseAPIHandlerDefinition,
  WhookAPIHandlerDefinition,
  WhookAPIParameterDefinition,
  WhookAPISchemaDefinition,
  WhookAPIExampleDefinition,
  WhookAPIHeaderDefinition,
  WhookAPIResponseDefinition,
  WhookAPIRequestBodyDefinition,
  WhookAPIHandlerModule,
} from './services/API_DEFINITIONS.js';
import type {
  AutoloadConfig,
  WhookWrapper,
  WhookServiceMap,
  WhookInitializerMap,
} from './services/_autoload.js';
import type { ProcessServiceConfig } from 'common-services';
import type {
  ErrorHandlerConfig,
  WhookErrorsDescriptors,
  WhookErrorDescriptor,
  HTTPRouterConfig,
  HTTPRouterProvider,
  HTTPRouterService,
} from '@whook/http-router';
import type {
  WhookOperation,
  WhookRequest,
  WhookHeaders,
  WhookResponse,
  WhookHandler,
  WhookHandlerFunction,
  HTTPTransactionConfig,
  HTTPTransactionService,
  ObfuscatorConfig,
  ObfuscatorService,
  APMService,
} from '@whook/http-transaction';
import type { BaseURLConfig, BaseURLEnv } from './services/BASE_URL.js';
import type { Dependencies } from 'knifecycle';
import initCompiler, { DEFAULT_COMPILER_OPTIONS } from './services/compiler.js';
import type {
  WhookCompilerOptions,
  WhookCompilerService,
  WhookCompilerConfig,
} from './services/compiler.js';
import type { Logger } from 'common-services';

export type {
  WhookAPIDefinitions,
  WhookAPIOperationAddition,
  WhookAPIOperation,
  WhookBaseAPIHandlerDefinition,
  WhookAPIHandlerDefinition,
  WhookAPIParameterDefinition,
  WhookAPISchemaDefinition,
  WhookAPIExampleDefinition,
  WhookAPIHeaderDefinition,
  WhookAPIResponseDefinition,
  WhookAPIRequestBodyDefinition,
  WhookAPIHandlerModule,
  WhookAPIOperationConfig,
  WhookServiceMap,
  WhookInitializerMap,
  WhookBuildConstantsService,
  ENVService,
  WhookErrorsDescriptors,
  WhookErrorDescriptor,
  HTTPServerConfig,
  HTTPServerProvider,
  HTTPServerService,
  ObfuscatorConfig,
  ObfuscatorService,
  APMService,
  WhookPluginsService,
  WhookPluginsPathsService,
  CONFIGSService,
  WhookConfig,
  WhookOperation,
  WhookRequest,
  WhookHeaders,
  WhookResponse,
  WhookHandler,
  WhookHandlerFunction,
  WhookWrapper,
  ProxyedENVConfig,
  HTTPTransactionService,
  HTTPTransactionConfig,
  HTTPRouterConfig,
  HTTPRouterProvider,
  HTTPRouterService,
  PortEnv,
  HostEnv,
  WhookCompilerConfig,
  WhookCompilerOptions,
  WhookCompilerService,
  WhookArgsTypes,
  WhookCommandHandler,
  WhookCommandDefinition,
  PromptArgs,
  WhookCommandArgs,
};
export {
  noop,
  identity,
  compose,
  pipe,
  initGetPing,
  initGetPingDefinition,
  initAutoload,
  DEFAULT_IGNORED_FILES_PREFIXES,
  DEFAULT_IGNORED_FILES_SUFFIXES,
  DEFAULT_REDUCED_FILES_SUFFIXES,
  initAPIDefinitions,
  initBuildConstants,
  initEnv,
  initProxyedENV,
  initPort,
  initHost,
  OPEN_API_METHODS,
  DEFAULT_ERROR_URI,
  DEFAULT_HELP_URI,
  DEFAULT_ERRORS_DESCRIPTORS,
  DEFAULT_DEFAULT_ERROR_CODE,
  HANDLER_REG_EXP,
  initCompiler,
  DEFAULT_COMPILER_OPTIONS,
  COMPONENTS_TYPES,
  cleanupOpenAPI,
  collectRefs,
  refersTo,
  mergeVaryHeaders,
  lowerCaseHeaders,
  runREPL,
  DEFAULT_BUILD_INITIALIZER_PATH_MAP,
  prepareBuildEnvironment,
  runBuild,
  readArgs,
  runCLI,
};

export type WhookBaseEnv = HTTPServerEnv & BaseURLEnv & HostEnv & PortEnv;
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WhookEnv extends WhookBaseEnv {}

export type WhookBaseConfigs = ProcessServiceConfig &
  HTTPRouterConfig &
  ErrorHandlerConfig &
  HTTPServerConfig &
  HTTPTransactionConfig &
  AutoloadConfig &
  BaseURLConfig &
  CONFIGSConfig &
  ENVConfig &
  ProcessServiceConfig &
  WhookPluginsPathsConfig & {
    CONFIG: WhookConfig;
  } & ObfuscatorConfig &
  WhookAPIDefinitionsConfig &
  WhookCompilerConfig;
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WhookConfigs extends WhookBaseConfigs {}

/* Architecture Note #1: Server run
Whook exposes a `runServer` function to programmatically spawn
 its server. It is intended to be reusable and injectable so
 that projects can override the whole `whook` default behavior.
*/
export async function runServer<
  D extends Dependencies,
  T extends Knifecycle = Knifecycle,
>(
  innerPrepareEnvironment: ($?: T) => Promise<T>,
  innerPrepareServer: (injectedNames: string[], $: T) => Promise<D>,
  injectedNames: string[] = [],
): Promise<D> {
  try {
    const $ = await innerPrepareEnvironment();
    const { ENV, log, ...services } = await innerPrepareServer(
      [...new Set([...injectedNames, 'ENV', 'log'])],
      $,
    );
    if (ENV.DRY_RUN) {
      log('warning', '🌵 - Dry run, shutting down now!');
      await $.destroy();
      return {} as D;
    }

    if (ENV.MERMAID_RUN) {
      const CONFIG_REG_EXP = /^([A-Z0-9_]+)$/;
      const MERMAID_GRAPH_CONFIG = {
        classes: {
          handlers: 'fill:#e7cdd2,stroke:#ebd4cb,stroke-width:1px;',
          config: 'fill:#d4cdcc,stroke:#ebd4cb,stroke-width:1px;',
          others: 'fill:#ebd4cb,stroke:#000,stroke-width:1px;',
        },
        styles: [
          {
            pattern: HANDLER_REG_EXP,
            className: 'handlers',
          },
          {
            pattern: CONFIG_REG_EXP,
            className: 'config',
          },
          {
            pattern: /^(.+)$/,
            className: 'others',
          },
        ],
        shapes: [
          {
            pattern: HANDLER_REG_EXP,
            template: '$0(($0))',
          },
          {
            pattern: CONFIG_REG_EXP,
            template: '$0{$0}',
          },
        ],
      };
      log('warning', '🌵 - Mermaid graph generated, shutting down now!');
      process.stdout.write($.toMermaidGraph(MERMAID_GRAPH_CONFIG));
      await $.destroy();
      return {} as D;
    }

    return { ENV, log, $instance: $, ...services } as unknown as D;
  } catch (err) {
    // eslint-disable-next-line
    console.error('💀 - Cannot launch the process:', printStackTrace(err));
    process.exit(1);
  }
}

/* Architecture Note #2: Server preparation
Whook exposes a `prepareServer` function to create its server
 configuration. It takes eventually additional injections that
 would be required at a higher level and a
 [Knifecycle](https://github.com/nfroidure/knifecycle)
 containing the bootstrapped environment and allowing
 to complete and run the server.
*/
/**
 * Runs the Whook server
 * @param {Array<String>} injectedNames
 * Root dependencies names to instanciate and return
 * @param {Knifecycle} $
 * The Knifecycle instance to use for the server run
 * @returns Object
 * A promise of the injected services
 */
export async function prepareServer<
  D extends Dependencies,
  T extends Knifecycle,
>(injectedNames: string[], $: T): Promise<D> {
  /* Architecture Note #2.1: Root injections
   * We need to inject `httpServer` and `process` to bring life to our
   *  server. We also inject `log` for logging purpose and custom other
   *  injected name that were required upfront.
   */
  const { log, ...services } = await $.run<{
    log: LogService;
  }>([...new Set([...injectedNames, 'log', 'httpServer', 'process'])]);

  log('warning', 'On air 🚀🌕');

  return { log, ...services } as unknown as D;
}

/* Architecture Note #3: Server environment
The Whook `prepareEnvironment` function aims to provide the complete
 server environment without effectively planning its run. It allows
 to use that environment for CLI or build purposes. It also
 provides a chance to override some services/constants
 before actually preparing the server.
 */
/**
 * Prepare the Whook server environment
 * @param {Knifecycle} $
 * The Knifecycle instance to set the various services
 * @returns Promise<Knifecycle>
 * A promise of the Knifecycle instance
 */
export async function prepareEnvironment<T extends Knifecycle>(
  $: T = new Knifecycle() as T,
): Promise<T> {
  /* Architecture Note #3.1: `PWD` env var
  The Whook server heavily rely on the process working directory
   to dynamically load contents. We are making it available to
   the DI system as a constant.
   */
  const PWD = process.cwd();
  $.register(constant('PWD', PWD));

  // Resolve
  $.register(initResolveService);

  // Importer
  $.register(initImporterService);

  /* Architecture Note #3.2: `NODE_ENV` env var
  Whook has different behaviors depending on the `NODE_ENV` value
   consider setting it to production before shipping.
   */
  const NODE_ENV = process.env.NODE_ENV || 'development';
  $.register(constant('NODE_ENV', NODE_ENV));

  /* Architecture Note #3.3: `WHOOK_PLUGINS` and `PROJECT_SRC`
  Whook need to know where to look up for things like
   commands / handlers etc...
   */
  $.register(constant('WHOOK_PLUGINS', ['@whook/whook']));

  /* Architecture Note #3.4: Logging
  Whook's default logger write to the NodeJS default console
   except for debugging messages where it uses the `debug`
   module so that you can set the `DEBUG` environment
   variable to `whook` and get debug messages in output.
   */
  $.register(
    constant('logger', {
      // eslint-disable-next-line
      output: console.info.bind(console),
      // eslint-disable-next-line
      error: console.error.bind(console),
      // eslint-disable-next-line
      debug: debug('whook'),
    } as Logger),
  );
  $.register(constant('exit', process.exit));

  // Needed to avoid a dead lock
  // TODO: Remove when fixed that issue
  // https://github.com/nfroidure/knifecycle/issues/108
  $.register(constant('LOG_ROUTING', DEFAULT_LOG_ROUTING));
  $.register(constant('LOG_CONFIG', DEFAULT_LOG_CONFIG));

  /* Architecture Note #3.5: Initializers
  Whook's embed a few default initializers proxied from
   `common-services`, `@whook/http-router` or its own
   `src/services` folder. It can be wrapped or overriden,
   at will, later in project's main file.
   */
  [
    initLogService,
    initTimeService,
    initRandomService,
    initDelayService,
    initProcessService,
    initHTTPRouter,
    initHTTPTransaction,
    initHTTPServer,
    initErrorHandler,
    initEnv,
    initConfigs,
    initWhookPluginsPaths,
    initProjectDir,
    initObfuscatorService,
    initAPMService,
  ].forEach($.register.bind($));

  return $;
}
