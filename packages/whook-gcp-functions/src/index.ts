/* eslint global-require:0 */
import fs from 'fs';
import util from 'util';
import path from 'path';
import mkdirp from 'mkdirp';
import cpr from 'cpr';
import { printStackTrace, YError } from 'yerror';
import { createRequire } from 'module';
import {
  Knifecycle,
  SPECIAL_PROPS,
  constant,
  initInitializerBuilder,
} from 'knifecycle';
import { initCompiler } from '@whook/whook';
import initBuildAutoloader from './services/_autoload.js';
import {
  dereferenceOpenAPIOperations,
  getOpenAPIOperations,
} from '@whook/http-router';
import type {
  Autoloader,
  Dependencies,
  BuildInitializer,
  Initializer,
  Service,
} from 'knifecycle';
import type {
  WhookOperation,
  WhookCompilerOptions,
  WhookCompilerService,
} from '@whook/whook';
import type { OpenAPIV3 } from 'openapi-types';
import type { LogService } from 'common-services';
import type { CprOptions } from 'cpr';

export const DEFAULT_BUILD_PARALLELISM = 10;

export type WhookGCPBuildConfig = {
  BUILD_PARALLELISM?: number;
};
export type WhookAPIOperationGCPFunctionConfig = {
  type?: 'http';
  sourceOperationId?: string;
  staticFiles?: string[];
  compilerOptions?: WhookCompilerOptions;
  suffix?: string;
};

const readFileAsync = util.promisify(fs.readFile) as (
  path: string,
  encoding: string,
) => Promise<string>;
const writeFileAsync = util.promisify(fs.writeFile) as (
  path: string,
  content: string,
  encoding: string,
) => Promise<void>;
const cprAsync = util.promisify(cpr) as (
  source: string,
  destination: string,
  options: CprOptions,
) => Promise<string[]>;

// TODO: Use import.meta when Jest will support it
const require = createRequire(path.join(process.cwd(), 'src', 'index.ts'));

const BUILD_DEFINITIONS: Record<
  NonNullable<WhookAPIOperationGCPFunctionConfig['type']>,
  {
    type: string;
    wrapper: { name: string; path: string };
    suffix?: string;
  }
> = {
  http: {
    type: 'HTTP',
    wrapper: {
      name: 'wrapHandlerForGoogleHTTPFunction',
      path: path.join(
        path.dirname(require.resolve('@whook/gcp-functions')),
        'wrappers/googleHTTPFunction.js',
      ),
    },
    suffix: 'Wrapped',
  },
};

export async function prepareBuildEnvironment<T extends Knifecycle>(
  $: T = new Knifecycle() as T,
): Promise<T> {
  $.register(
    constant('INITIALIZER_PATH_MAP', {
      ENV: '@whook/whook/dist/services/ProxyedENV',
      log: '@whook/gcp-functions/dist/services/log',
      time: 'common-services/dist/time',
      delay: 'common-services/dist/delay',
    }),
  );
  $.register(initInitializerBuilder);
  $.register(initBuildAutoloader);
  $.register(initCompiler);
  $.register(constant('PORT', 1337));
  $.register(constant('HOST', 'localhost'));

  return $;
}

export async function runBuild(
  aPrepareBuildEnvironment: typeof prepareBuildEnvironment,
): Promise<void> {
  try {
    const handlerName = process.argv[2];
    const $ = await aPrepareBuildEnvironment();
    const {
      NODE_ENV,
      BUILD_PARALLELISM,
      PROJECT_DIR,
      compiler,
      log,
      $autoload,
      API,
      buildInitializer,
    }: WhookGCPBuildConfig & {
      NODE_ENV: string;
      PROJECT_DIR: string;
      compiler: WhookCompilerService;
      log: LogService;
      $autoload: Autoloader<Initializer<Dependencies, Service>>;
      API: OpenAPIV3.Document;
      buildInitializer: BuildInitializer;
    } = await $.run([
      'NODE_ENV',
      '?BUILD_PARALLELISM',
      'PROJECT_DIR',
      'process',
      'compiler',
      'log',
      '$autoload',
      'API',
      'buildInitializer',
    ]);

    log('info', 'GCP Functions build Environment initialized 🚀🌕');

    const operations = (
      await dereferenceOpenAPIOperations(
        API,
        getOpenAPIOperations<WhookAPIOperationGCPFunctionConfig>(API),
      )
    ).filter((operation) => {
      if (handlerName) {
        const sourceOperationId =
          operation['x-whook'] && operation['x-whook'].sourceOperationId;

        return (
          handlerName === operation.operationId ||
          handlerName === sourceOperationId
        );
      }
      return true;
    });

    log('warning', `${operations.length} operations to process.`);
    await processOperations(
      {
        NODE_ENV,
        BUILD_PARALLELISM: BUILD_PARALLELISM || DEFAULT_BUILD_PARALLELISM,
        PROJECT_DIR,
        compiler,
        log,
        $autoload,
        buildInitializer,
      },
      operations,
    );
    await $.destroy();
  } catch (err) {
    // eslint-disable-next-line
    console.error(
      '💀 - Cannot launch the build:',
      printStackTrace(err),
      JSON.stringify((err as YError)?.params, null, 2),
    );
    process.exit(1);
  }
}

async function processOperations(
  {
    NODE_ENV,
    BUILD_PARALLELISM,
    PROJECT_DIR,
    compiler,
    log,
    $autoload,
    buildInitializer,
  }: WhookGCPBuildConfig & {
    NODE_ENV: string;
    PROJECT_DIR: string;
    compiler: WhookCompilerService;
    log: LogService;
    $autoload: Autoloader<Initializer<Dependencies, Service>>;
    buildInitializer: BuildInitializer;
  },
  operations: WhookOperation<WhookAPIOperationGCPFunctionConfig>[],
): Promise<void> {
  const operationsLeft = operations.slice(BUILD_PARALLELISM);

  await Promise.all(
    operations.slice(0, BUILD_PARALLELISM).map((operation) =>
      buildAnyLambda(
        {
          NODE_ENV,
          PROJECT_DIR,
          compiler,
          log,
          $autoload,
          buildInitializer,
        },
        operation,
      ),
    ),
  );

  if (operationsLeft.length) {
    log('info', operationsLeft.length, ' operations left.');
    return processOperations(
      {
        NODE_ENV,
        BUILD_PARALLELISM,
        PROJECT_DIR,
        compiler,
        log,
        $autoload,
        buildInitializer,
      },
      operationsLeft,
    );
  }
  log('info', 'No more operations.');
}

async function buildAnyLambda(
  {
    NODE_ENV,
    PROJECT_DIR,
    compiler,
    log,
    $autoload,
    buildInitializer,
  }: {
    NODE_ENV: string;
    PROJECT_DIR: string;
    compiler: WhookCompilerService;
    log: LogService;
    $autoload: Autoloader<Initializer<Dependencies, Service>>;
    buildInitializer: BuildInitializer;
  },
  operation: WhookOperation<WhookAPIOperationGCPFunctionConfig>,
): Promise<void> {
  const { operationId } = operation;

  try {
    const whookConfig: WhookAPIOperationGCPFunctionConfig = operation[
      'x-whook'
    ] || { type: 'http' };
    const operationType = whookConfig.type || 'http';
    const sourceOperationId = whookConfig.sourceOperationId;
    const entryPoint = operationId;
    const finalEntryPoint =
      (sourceOperationId ? sourceOperationId : operationId) +
      ((operation['x-whook'] || {}).suffix || '');
    log('warning', `Building ${operationType} "${finalEntryPoint}"...`);
    const buildDefinition = BUILD_DEFINITIONS[operationType];
    // eslint-disable-next-line
    const applyWrapper = (await import(buildDefinition.wrapper.path)).default;
    const rootNode = await $autoload(
      entryPoint + (buildDefinition.suffix || ''),
    );
    const lambdaPath = path.join(
      PROJECT_DIR,
      'builds',
      NODE_ENV,
      finalEntryPoint,
    );
    const finalHandlerInitializer = applyWrapper(rootNode.initializer);

    const initializerContent = await buildInitializer(
      finalHandlerInitializer[SPECIAL_PROPS.INJECT].map((name) =>
        name === 'OPERATION_API'
          ? `OPERATION_API>OPERATION_API_${finalEntryPoint}`
          : name,
      ),
    );
    const indexContent = await buildLambdaIndex(rootNode, {
      name: buildDefinition.wrapper.name,
      path: buildDefinition.wrapper.path,
    });

    await mkdirp(lambdaPath);
    await Promise.all([
      copyStaticFiles(
        { PROJECT_DIR, log },
        lambdaPath,
        whookConfig.staticFiles || [],
      ),
      ensureFileAsync(
        { log },
        path.join(lambdaPath, 'initialize.js'),
        initializerContent,
      ),
      ensureFileAsync({ log }, path.join(lambdaPath, 'main.js'), indexContent),
    ]);
    await buildFinalLambda({ compiler, log }, lambdaPath, whookConfig);
  } catch (err) {
    log('error', `Error building "${operationId}"...`);
    log('error-stack', printStackTrace(err));
    log('debug', JSON.stringify((err as YError).params, null, 2));
    throw YError.wrap(err as Error, 'E_LAMBDA_BUILD', operationId);
  }
}

async function buildLambdaIndex(
  rootNode: { path: string },
  buildWrapper: { name: string; path: string },
): Promise<string> {
  return `import initHandler from '${rootNode.path}';
import ${buildWrapper.name} from '${buildWrapper.path}';
import { initialize } from './initialize.js';

const handlerInitializer = ${buildWrapper.name}(
    initHandler
);

const handlerPromise = initialize()
  .then(handlerInitializer);

  export default function handler (req, res) {
  return handlerPromise
  .then(handler => handler(req, res));
};
`;
}

async function buildFinalLambda(
  { compiler, log }: { compiler: WhookCompilerService; log: LogService },
  lambdaPath: string,
  whookConfig: WhookAPIOperationGCPFunctionConfig,
): Promise<void> {
  const entryPoint = `${lambdaPath}/main.js`;
  const { extension, contents, mappings } = await compiler(
    entryPoint,
    whookConfig.compilerOptions,
  );

  await Promise.all([
    ensureFileAsync(
      { log },
      path.join(lambdaPath, `/index${extension}`),
      contents,
      'utf-8',
    ),
    mappings
      ? ensureFileAsync(
          { log },
          path.join(lambdaPath, `/index${extension}.map`),
          mappings,
          'utf-8',
        )
      : Promise.resolve(),
  ]);
}

async function copyStaticFiles(
  { PROJECT_DIR, log }: { PROJECT_DIR: string; log: LogService },
  lambdaPath: string,
  staticFiles: string[] = [],
): Promise<void> {
  await Promise.all(
    staticFiles.map(
      async (staticFile) =>
        await copyFiles(
          { log },
          path.join(PROJECT_DIR, 'node_modules', staticFile),
          path.join(lambdaPath, 'node_modules', staticFile),
        ),
    ),
  );
}

async function copyFiles(
  { log }: { log: LogService },
  source: string,
  destination: string,
): Promise<void> {
  let theError;
  try {
    await mkdirp(destination);
    const data = await readFileAsync(source, 'utf-8');
    await ensureFileAsync({ log }, destination, data, 'utf-8');
  } catch (err) {
    theError = err;
  }
  if (theError) {
    if ('EISDIR' !== theError.code) {
      throw theError;
    }
    await cprAsync(source, destination, {
      overwrite: true,
    });
  }
}

async function ensureFileAsync(
  { log }: { log: LogService },
  path: string,
  content: string,
  encoding = 'utf-8',
): Promise<void> {
  try {
    const oldContent = await readFileAsync(path, encoding);

    if (oldContent === content) {
      log('debug', `Ignore unchanged file: "${path}".`);
      return;
    }
  } catch (err) {
    log('debug', `Write new file: "${path}".`);
    return await writeFileAsync(path, content, encoding);
  }
  log('debug', `Write changed file: "${path}".`);
  return await writeFileAsync(path, content, encoding);
}
