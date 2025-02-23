# API
## Functions

<dl>
<dt><a href="#prepareServer">prepareServer(injectedNames, $)</a> ⇒</dt>
<dd><p>Runs the Whook server</p>
</dd>
<dt><a href="#prepareEnvironment">prepareEnvironment($)</a> ⇒</dt>
<dd><p>Prepare the Whook server environment</p>
</dd>
<dt><a href="#initAPIDefinitions">initAPIDefinitions(services)</a> ⇒ <code>Promise.&lt;String&gt;</code></dt>
<dd><p>Initialize the API_DEFINITIONS service according to the porject handlers.</p>
</dd>
<dt><a href="#initBaseURL">initBaseURL(services)</a> ⇒ <code>Promise.&lt;String&gt;</code></dt>
<dd><p>Initialize the BASE_URL service according to the HOST/PORT
 so that applications fallbacks to that default base URL.</p>
</dd>
<dt><a href="#initBuildConstants">initBuildConstants(constants)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Allow to proxy constants directly by serializing it in the
 build, saving some computing and increasing boot time of
 the build.</p>
</dd>
<dt><a href="#initCONFIGS">initCONFIGS(services)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Initialize the CONFIGS service according to the NODE_ENV</p>
</dd>
<dt><a href="#initENV">initENV(services)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Initialize the ENV service using process env plus dotenv files</p>
</dd>
<dt><a href="#initHost">initHost(services)</a> ⇒ <code>Promise.&lt;String&gt;</code></dt>
<dd><p>Initialize the HOST service from ENV or auto-detection if
 none specified in ENV</p>
</dd>
<dt><a href="#initImporter">initImporter(path)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Allow to import ES modules.</p>
</dd>
<dt><a href="#initPort">initPort(services)</a> ⇒ <code>Promise.&lt;Number&gt;</code></dt>
<dd><p>Initialize the PORT service from ENV or auto-detection if
 none specified in ENV</p>
</dd>
<dt><a href="#initProjectDir">initProjectDir(services)</a> ⇒ <code>Promise.&lt;string&gt;</code></dt>
<dd><p>Auto detect the Whook PROJECT_DIR</p>
</dd>
<dt><a href="#wrapEnvForBuild">wrapEnvForBuild(services)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Wrap the ENV service in order to filter ENV vars for the build</p>
</dd>
<dt><a href="#initResolve">initResolve(path)</a> ⇒ <code>Promise.&lt;string&gt;</code></dt>
<dd><p>Allow to resolve a path with the module system.</p>
</dd>
<dt><a href="#initWhookPluginsPaths">initWhookPluginsPaths(services)</a> ⇒ <code>Promise.&lt;string&gt;</code></dt>
<dd><p>Auto detect the Whook WHOOK_PLUGINS_PATHS</p>
</dd>
</dl>

<a name="prepareServer"></a>

## prepareServer(injectedNames, $) ⇒
Runs the Whook server

**Kind**: global function  
**Returns**: Object
A promise of the injected services  

| Param | Type | Description |
| --- | --- | --- |
| injectedNames | <code>Array.&lt;String&gt;</code> | Root dependencies names to instanciate and return |
| $ | <code>Knifecycle</code> | The Knifecycle instance to use for the server run |

<a name="prepareEnvironment"></a>

## prepareEnvironment($) ⇒
Prepare the Whook server environment

**Kind**: global function  
**Returns**: Promise<Knifecycle>
A promise of the Knifecycle instance  

| Param | Type | Description |
| --- | --- | --- |
| $ | <code>Knifecycle</code> | The Knifecycle instance to set the various services |

<a name="initAPIDefinitions"></a>

## initAPIDefinitions(services) ⇒ <code>Promise.&lt;String&gt;</code>
Initialize the API_DEFINITIONS service according to the porject handlers.

**Kind**: global function  
**Returns**: <code>Promise.&lt;String&gt;</code> - A promise of a containing the actual host.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services API_DEFINITIONS depends on |
| services.PROJECT_SRC | <code>Object</code> |  | The project sources location |
| services.WHOOK_PLUGINS_PATHS | <code>Object</code> |  | The plugins paths to load services from |
| [services.IGNORED_FILES_SUFFIXES] | <code>Object</code> |  | The files suffixes the autoloader must ignore |
| [services.IGNORED_FILES_PREFIXES] | <code>Object</code> |  | The files prefixes the autoloader must ignore |
| [services.FILTER_API_TAGS] | <code>Object</code> |  | Allows to only keep the endpoints taggeds with  the given tags |
| services.importer | <code>Object</code> |  | A service allowing to dynamically import ES modules |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |

<a name="initBaseURL"></a>

## initBaseURL(services) ⇒ <code>Promise.&lt;String&gt;</code>
Initialize the BASE_URL service according to the HOST/PORT
 so that applications fallbacks to that default base URL.

**Kind**: global function  
**Returns**: <code>Promise.&lt;String&gt;</code> - A promise of a containing the actual host.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services BASE_URL depends on |
| services.ENV | <code>Object</code> |  | The process environment |
| services.CONFIG | <code>Object</code> |  | The injected CONFIG value |
| [services.PROTOCOL] | <code>Object</code> |  | The injected PROTOCOL value |
| services.HOST | <code>Object</code> |  | The injected HOST value |
| services.PORT | <code>Object</code> |  | The injected PORT value |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |

<a name="initBuildConstants"></a>

## initBuildConstants(constants) ⇒ <code>Promise.&lt;Object&gt;</code>
Allow to proxy constants directly by serializing it in the
 build, saving some computing and increasing boot time of
 the build.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - A promise of an object containing the gathered constants.  

| Param | Type | Description |
| --- | --- | --- |
| constants | <code>Object</code> | The serializable constants to gather |

**Example**  
```js
import { initBuildConstants } from '@whook/whook';
import { alsoInject } from 'knifecycle';

export default alsoInject(['MY_OWN_CONSTANT'], initBuildConstants);
```
<a name="initCONFIGS"></a>

## initCONFIGS(services) ⇒ <code>Promise.&lt;Object&gt;</code>
Initialize the CONFIGS service according to the NODE_ENV

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - A promise of a an object the actual configuration properties.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services CONFIGS depends on |
| services.NODE_ENV | <code>Object</code> |  | The injected NODE_ENV value |
| services.PROJECT_SRC | <code>Object</code> |  | The project source directory |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |
| services.importer | <code>Object</code> |  | A service allowing to dynamically import ES modules |

<a name="initENV"></a>

## initENV(services) ⇒ <code>Promise.&lt;Object&gt;</code>
Initialize the ENV service using process env plus dotenv files

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - A promise of an object containing the actual env vars.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services ENV depends on |
| services.NODE_ENV | <code>Object</code> |  | The injected NODE_ENV value to look for `.env.${NODE_ENV}` env file |
| services.PWD | <code>Object</code> |  | The process current working directory |
| [services.BASE_ENV] | <code>Object</code> | <code>{}</code> | An optional base environment |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |

<a name="initHost"></a>

## initHost(services) ⇒ <code>Promise.&lt;String&gt;</code>
Initialize the HOST service from ENV or auto-detection if
 none specified in ENV

**Kind**: global function  
**Returns**: <code>Promise.&lt;String&gt;</code> - A promise of a containing the actual host.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services HOST depends on |
| [services.ENV] | <code>Object</code> | <code>{}</code> | An optional environment object |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |
| services.importer | <code>Object</code> |  | A service allowing to dynamically import ES modules |

<a name="initImporter"></a>

## initImporter(path) ⇒ <code>Promise.&lt;Object&gt;</code>
Allow to import ES modules.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - A promise of an imported module.  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | The module path |

<a name="initPort"></a>

## initPort(services) ⇒ <code>Promise.&lt;Number&gt;</code>
Initialize the PORT service from ENV or auto-detection if
 none specified in ENV

**Kind**: global function  
**Returns**: <code>Promise.&lt;Number&gt;</code> - A promise of a number representing the actual port.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services PORT depends on |
| [services.ENV] | <code>Object</code> | <code>{}</code> | An optional environment object |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |
| services.importer | <code>Object</code> |  | A service allowing to dynamically import ES modules |

<a name="initProjectDir"></a>

## initProjectDir(services) ⇒ <code>Promise.&lt;string&gt;</code>
Auto detect the Whook PROJECT_DIR

**Kind**: global function  
**Returns**: <code>Promise.&lt;string&gt;</code> - A promise of a number representing the actual port.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services PROJECT_DIR depends on |
| services.PWD | <code>Object</code> |  | The process working directory |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |

<a name="wrapEnvForBuild"></a>

## wrapEnvForBuild(services) ⇒ <code>Promise.&lt;Object&gt;</code>
Wrap the ENV service in order to filter ENV vars for the build

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - A promise of an object containing the reshaped env vars.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services ENV depends on |
| services.NODE_ENV | <code>Object</code> |  | The injected NODE_ENV value to add it to the build env |
| [services.PROXYED_ENV_VARS] | <code>Object</code> | <code>{}</code> | A list of environment variable names to proxy |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |

<a name="initResolve"></a>

## initResolve(path) ⇒ <code>Promise.&lt;string&gt;</code>
Allow to resolve a path with the module system.

**Kind**: global function  
**Returns**: <code>Promise.&lt;string&gt;</code> - A promise of a fully qualified module path  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | The serializable constants to gather |

<a name="initWhookPluginsPaths"></a>

## initWhookPluginsPaths(services) ⇒ <code>Promise.&lt;string&gt;</code>
Auto detect the Whook WHOOK_PLUGINS_PATHS

**Kind**: global function  
**Returns**: <code>Promise.&lt;string&gt;</code> - A promise of a number representing the actual port.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services WHOOK_PLUGINS_PATHS depends on |
| services.WHOOK_PLUGINS | <code>Array.&lt;String&gt;</code> |  | The active whook plugins list |
| services.PROJECT_SRC | <code>String</code> |  | The project source directory |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |

