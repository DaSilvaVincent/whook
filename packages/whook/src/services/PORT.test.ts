import { describe, it, beforeEach, jest, expect } from '@jest/globals';
import initPORT from './PORT.js';
import { initImporterService } from 'common-services';
import type { PortFinderModule } from './PORT.js';
import type { LogService } from 'common-services';

describe('initPORT', () => {
  const log = jest.fn<LogService>();

  beforeEach(() => {
    log.mockReset();
  });

  it('should use the env port first', async () => {
    const importer = await initImporterService<PortFinderModule>({ log });
    const port = await initPORT({
      ENV: { PORT: '1337' },
      importer,
      log,
    });

    expect({
      port,
    }).toMatchInlineSnapshot(`
      {
        "port": 1337,
      }
    `);
    expect({
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchSnapshot();
  });

  it('should find a port by itself if no env port', async () => {
    const importer = await initImporterService<PortFinderModule>({ log });
    const port = await initPORT({
      importer,
      log,
    });

    expect(port).toBeGreaterThan(0);
    expect({
      logCalls: log.mock.calls
        .filter((args) => 'debug-stack' !== args[0])
        .map(([arg1, arg2, ...args]) => {
          return [
            arg1,
            (arg2 || '').toString().replace(/port (\d+)/, 'port ${PORT}'),
            ...args,
          ];
        }),
    }).toMatchSnapshot();
  });
});
