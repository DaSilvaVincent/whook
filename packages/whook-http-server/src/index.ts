import { name, autoProvider } from 'knifecycle';
import http from 'http';
import ms from 'ms';
import { YError } from 'yerror';
import type { Provider } from 'knifecycle';
import type { LogService } from 'common-services';
import type { HTTPRouterService } from '@whook/http-router';
import type { Socket } from 'net';

export type HTTPServerEnv = {
  DESTROY_SOCKETS?: string;
};
export type HTTPServerConfig = {
  HOST?: string;
  PORT?: number;
  MAX_HEADERS_COUNT?: number;
  KEEP_ALIVE_TIMEOUT?: number;
  SOCKET_TIMEOUT?: number;
  MAX_CONNECTIONS?: number;
};
export type HTTPServerDependencies = HTTPServerConfig & {
  ENV?: HTTPServerEnv;
  HOST: string;
  PORT: number;
  httpRouter: HTTPRouterService;
  log?: LogService;
};
export type HTTPServerService = http.Server;
export type HTTPServerProvider = Provider<HTTPServerService>;

function noop() {
  return undefined;
}

const DEFAULT_ENV = {};

export default name('httpServer', autoProvider(initHTTPServer));

/**
 * Initialize an HTTP server
 * @name initHTTPServer
 * @function
 * @param  {Object}   services
 * The services the server depends on
 * @param  {Object}   [services.ENV]
 * The process environment variables
 * @param  {String}   services.ENV.DESTROY_SOCKETS
 * Whether the server sockets whould be destroyed or if the
 *  server should wait while sockets are kept alive
 * @param  {String}   services.HOST
 * The server host
 * @param  {Number}   services.PORT
 * The server port
 * @param  {Number}   [services.MAX_HEADERS_COUNT]
 * The https://nodejs.org/api/http.html#http_server_maxheaderscount
 * @param  {Number}   [services.KEEP_ALIVE_TIMEOUT]
 * See https://nodejs.org/api/http.html#http_server_keepalivetimeout
 * @param  {Number}   [services.MAX_CONNECTIONS]
 * See https://nodejs.org/api/net.html#net_server_maxconnections
 * @param  {Number}   [services.SOCKET_TIMEOUT]
 * See https://nodejs.org/api/http.html#http_server_timeout
 * @param  {Function} services.httpRouter
 * The function to run with the req/res tuple
 * @param  {Function} [services.log=noop]
 * A logging function
 * @return {Promise<HTTPServer>}
 * A promise of an object with a NodeJS HTTP server
 *  in its `service` property.
 */
async function initHTTPServer({
  ENV = DEFAULT_ENV,
  HOST,
  PORT,
  MAX_HEADERS_COUNT = 800,
  KEEP_ALIVE_TIMEOUT = ms('5m'),
  SOCKET_TIMEOUT = ms('2m'),
  MAX_CONNECTIONS = Infinity,
  httpRouter,
  log = noop,
}: HTTPServerDependencies): Promise<HTTPServerProvider> {
  const sockets: Set<Socket> = ENV.DESTROY_SOCKETS
    ? new Set()
    : (undefined as unknown as Set<Socket>);
  /**
    @typedef HTTPServer
  */
  const httpServer = http.createServer(httpRouter);
  const listenPromise = new Promise((resolve) => {
    httpServer.listen(PORT, HOST, () => {
      log('warning', `🎙️ - HTTP Server listening at "http://${HOST}:${PORT}".`);
      resolve(httpServer);
    });
  });
  const fatalErrorPromise: Promise<void> = new Promise((_, reject) => {
    httpServer.once('error', (err) =>
      reject(YError.wrap(err as Error, 'E_HTTP_SERVER_ERROR')),
    );
  });

  httpServer.timeout = SOCKET_TIMEOUT;
  httpServer.keepAliveTimeout = KEEP_ALIVE_TIMEOUT;
  httpServer.maxHeadersCount = MAX_HEADERS_COUNT;
  httpServer.maxConnections = MAX_CONNECTIONS;

  if ('undefined' !== typeof MAX_CONNECTIONS) {
    httpServer.maxConnections = MAX_CONNECTIONS;
  }

  if (ENV.DESTROY_SOCKETS) {
    httpServer.on('connection', (socket) => {
      sockets.add(socket);
      socket.on('close', () => {
        sockets.delete(socket);
      });
    });
  }

  return Promise.race([listenPromise, fatalErrorPromise]).then(() => ({
    service: httpServer,
    fatalErrorPromise,
    dispose: async () => {
      await new Promise<void>((resolve, reject) => {
        log('debug', '✅ - Closing HTTP server.');
        // Avoid to keepalive connections on shutdown
        httpServer.timeout = 1;
        httpServer.keepAliveTimeout = 1;
        httpServer.close((err) => {
          if (err) {
            reject(err);
            return;
          }
          log('debug', '✔️ - HTTP server closed!');
          resolve();
        });
        if (ENV.DESTROY_SOCKETS) {
          for (const socket of sockets.values()) {
            socket.destroy();
          }
        }
      });
    },
  }));
}
