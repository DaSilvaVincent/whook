import { describe, it, beforeEach, jest, expect } from '@jest/globals';
import initPrintEnvCommand from './printEnv.js';
import type { LogService } from 'common-services';

describe('printEnvCommand', () => {
  const log = jest.fn<LogService>();

  beforeEach(() => {
    log.mockReset();
  });

  it('should work', async () => {
    // Have to use Object.assign for some reason here
    // See : https://stackoverflow.com/questions/56349619/ts2352-declare-object-with-dynamic-properties-and-one-property-with-specific-t
    const printEnvCommand = await initPrintEnvCommand({
      log,
      ENV: { NODE_ENV: 'test' },
      args: {
        command: 'whook',
        namedArguments: {
          keysOnly: true,
        },
        rest: ['printEnv'],
      },
    });
    const result = await printEnvCommand();

    expect({
      result,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchSnapshot();
  });
});
