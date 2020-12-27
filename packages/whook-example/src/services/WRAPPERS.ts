import { service } from 'knifecycle';
import { wrapHandlerWithCORS } from '@whook/cors';
import { wrapHandlerWithAuthorization } from '@whook/authorization';
import type { Service, Dependencies } from 'knifecycle';
import type { WhookWrapper } from '@whook/whook';

export default service(initWrappers, 'WRAPPERS');

// Wrappers are allowing you to override every
// handlers of your API with specific behaviors,
// here we add CORS and HTTP authorization support
async function initWrappers(): Promise<WhookWrapper<Dependencies, Service>[]> {
  const WRAPPERS = [wrapHandlerWithCORS, wrapHandlerWithAuthorization];

  return WRAPPERS;
}
