import { wrapInitializer, alsoInject } from 'knifecycle';
import { pickFirstHeaderValue } from '@whook/http-transaction';
import type { ServiceInitializer, Dependencies } from 'knifecycle';
import type { HTTPTransactionService } from '@whook/whook';
import type { LogService } from 'common-services';
import type { WhookHTTPTransaction } from '@whook/http-transaction';
import type { ServerResponse, IncomingMessage } from 'http';

/**
 * Wrap the Whook transaction service to handle method
 *  overriding (often needed for using the `patch` method).
 * @param {Function} initHandler The handler initializer
 * @returns {Function} The handler initializer wrapped
 */
export default function wrapHTTPTransactionWithMethodOverride<
  D extends Dependencies,
>(
  initHTTPTransaction: ServiceInitializer<D, HTTPTransactionService>,
): ServiceInitializer<D & { log: LogService }, HTTPTransactionService> {
  const augmentedInitializer = alsoInject<
    { log: LogService },
    D,
    HTTPTransactionService
  >(['log'], initHTTPTransaction);

  return wrapInitializer(
    async (
      services: { log: LogService } & D,
      httpTransaction: HTTPTransactionService,
    ) => {
      services.log(
        'debug',
        '🔧 - Wrapping transactions with methods override.',
      );
      return async (
        req: IncomingMessage,
        res: ServerResponse,
      ): Promise<WhookHTTPTransaction> => {
        const { request, transaction } = await httpTransaction(req, res);
        const xHTTPMethodOverride = pickFirstHeaderValue(
          'x-http-method-override',
          request.headers,
        );

        return {
          request: {
            ...request,
            method: xHTTPMethodOverride
              ? xHTTPMethodOverride.toLowerCase()
              : request.method,
            headers: Object.keys(request.headers)
              .filter((headerName) => 'x-http-method-override' === headerName)
              .reduce((newHeaders, headerName) => {
                newHeaders[headerName] = request.headers[headerName];
                return newHeaders;
              }, {}),
          },
          transaction,
        };
      };
    },
    augmentedInitializer,
  );
}
