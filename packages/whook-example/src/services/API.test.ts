import {
  describe,
  it,
  beforeAll,
  beforeEach,
  jest,
  expect,
} from '@jest/globals';
import initAPI from './API.js';
import FULL_CONFIG from '../config/test/config.js';
import { getOpenAPIOperations } from '@whook/http-router';
import { initAPIDefinitions } from '@whook/whook';
import { initImporterService } from 'common-services';
import path from 'path';
import { createRequire } from 'module';
import type { LogService } from 'common-services';
import type { WhookAPIHandlerModule } from '@whook/whook';

describe('API', () => {
  // TODO: Use import.meta when Jest will support it
  const require = createRequire(
    path.join(process.cwd(), 'src', 'services', 'API.test.ts'),
  );
  const { CONFIG } = FULL_CONFIG;
  const BASE_URL = 'http://localhost:1337';
  const log = jest.fn<LogService>();
  let API_DEFINITIONS;

  beforeAll(async () => {
    const importer = await initImporterService<WhookAPIHandlerModule>({ log });

    API_DEFINITIONS = await initAPIDefinitions({
      PROJECT_SRC: path.join(process.cwd(), 'src'),
      WHOOK_PLUGINS_PATHS: [path.dirname(require.resolve('@whook/whook/dist'))],
      importer,
    });
  });

  beforeEach(() => {
    log.mockReset();
  });

  it('should work', async () => {
    const API = await initAPI({
      ENV: {},
      CONFIG,
      BASE_URL,
      API_VERSION: '1.1.0',
      API_DEFINITIONS,
      log,
    });

    expect({
      API,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchSnapshot();
  });

  it('should always use declared security definition', async () => {
    const API = await initAPI({
      ENV: {},
      CONFIG,
      BASE_URL,
      API_VERSION: '1.1.0',
      API_DEFINITIONS,
      log,
    });
    const securitySchemes = API.components?.securitySchemes || {};
    const operations = getOpenAPIOperations(API);

    expect(
      operations
        .filter((operation) => operation.security && operation.security.length)
        .filter((operation) =>
          (operation.security || []).some((operationSecurity) =>
            Object.keys(operationSecurity).some(
              (operationSecurityName) =>
                !securitySchemes[operationSecurityName],
            ),
          ),
        )
        .map(({ method, path }) => `${method} ${path}`)
        .sort(),
    ).toEqual([]);
  });

  // it('should produce a valid OpenAPI file', async () => {
  //   const API = await initAPI({
  //     ENV: {},
  //     CONFIG,
  //     BASE_URL,
  //     API_VERSION: '1.1.0',
  //     API_DEFINITIONS,
  //     log,
  //   });

  //   const result = new OpenAPISchemaValidator({ version: 3 }).validate(
  //     // Temporar type fix due to version mismatch of OpenAPIV3
  //     // between Whook and OpenAPISchemaValidator
  //     API as any,
  //   );

  //   expect({ result }).toMatchSnapshot();
  // });

  describe('should always have the same amount of', () => {
    let operations;

    beforeAll(async () => {
      const API = await initAPI({
        ENV: {},
        CONFIG,
        BASE_URL,
        API_VERSION: '1.1.0',
        API_DEFINITIONS,
        log,
      });

      operations = getOpenAPIOperations(API);
    });

    it('endpoints', async () => {
      expect(
        operations
          .filter(
            (operation) =>
              !operation['x-whook'] || !operation['x-whook'].private,
          )
          .map(({ method, path }) => `${method} ${path}`)
          .sort(),
      ).toMatchSnapshot();
    });

    it('publicly documented endpoints', async () => {
      expect(
        operations
          .filter(
            (operation) =>
              !operation['x-whook'] || !operation['x-whook'].private,
          )
          .map(({ method, path }) => `${method} ${path}`)
          .sort(),
      ).toMatchSnapshot();
    });

    it('non authenticated endpoints', async () => {
      expect(
        operations
          .filter(
            (operation) =>
              !operation.security || operation.security.length === 0,
          )
          .map(({ method, path }) => `${method} ${path}`)
          .sort(),
      ).toMatchSnapshot();
    });

    it('optionally authenticated endpoints', async () => {
      expect(
        operations
          .filter(
            (operation) =>
              operation.security &&
              operation.security.some(
                (security) => Object.keys(security).length === 0,
              ),
          )
          .map(({ method, path }) => `${method} ${path}`)
          .sort(),
      ).toMatchSnapshot();
    });

    it('basic authenticated endpoints', async () => {
      expect(
        operations
          .filter(
            (operation) =>
              operation.security &&
              operation.security.some((security) => security.basicAuth),
          )
          .map(({ method, path }) => `${method} ${path}`)
          .sort(),
      ).toMatchSnapshot();
    });

    it('bearer authenticated endpoints', async () => {
      expect(
        operations
          .filter(
            (operation) =>
              operation.security &&
              operation.security.some((security) => security.bearerAuth),
          )
          .map(({ method, path }) => `${method} ${path}`)
          .sort(),
      ).toMatchSnapshot();
    });
  });
});
