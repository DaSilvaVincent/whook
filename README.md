[//]: # ( )
[//]: # (This file is automatically generated by a `metapak`)
[//]: # (module. Do not change it  except between the)
[//]: # (`content:start/end` flags, your changes would)
[//]: # (be overridden.)
[//]: # ( )
# whook
> Build strong and efficient REST web services.

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/nfroidure/whook/blob/master/LICENSE)
[![Build status](https://secure.travis-ci.org/nfroidure/whook.svg)](https://travis-ci.org/nfroidure/whook)
[![Coverage Status](https://coveralls.io/repos/nfroidure/whook/badge.svg?branch=master)](https://coveralls.io/r/nfroidure/whook?branch=master)


[//]: # (::contents:start)

[![Coverage Status](https://coveralls.io/repos/nfroidure/whook/badge.svg?branch=master)](https://coveralls.io/r/nfroidure/whook?branch=master)

Why write code when you have an OpenAPI definition?
 [Check this deck](https://slides.com/nfroidure/introducing-whook)
 for a complete introduction to Whook's principles!

## Summary

Whook eats your documentation and provide you with a
 performant router that take care of running the right
 code for the right operation.

By using the OpenAPI standard and the dependency injection
 pattern, Whook provides a convenient, highly modular and easily
 testable back end framework.

## Quickstart

To start a new Whook project:

```sh
# Initialize the project
npm init @whook;
cd my_project_name;

# Check install with a dry run of the server
DRY_RUN=1 npm run start

# Run tests
npm t
```

## Usage

The documentation and a tutorial are still to be written but
 the code is easy to read so let's dive in in the meanwhile.

## Principles
This projects aims to make creating well documented and highly
 customizable REST APIs a breeze. It is the final outcome of my experience
 [building REST APIs with NodeJS](https://insertafter.com/en/blog/http_rest_apis_with_nodejs.html).

By relying on the [OpenAPI format](https://www.openapis.org/)
 to declare a new endpoint, this project forces documentation before code.
It also is highly customizable since based on the dependency injection
 with inversion of control pattern allowing you to override or wrap its main
 constituents.

![Architecture Overview](./overview.svg)

The Whook route handling flow is very simple.

First, we have a HTTPServer that handles requests an serve responses
 (the `httpServer` service).

Then, the `httpTransaction` transform the NodeJS requests into raw
 serializable ones (raw objects with no methods nor internal states).

Then the router (`httpRouter`) deal with that request to test which
 handler need to be run by comparing the method/path couple with the
 OpenAPI operations declarations.

Once found, it simply runs the right handler with the OpenAPI
 parameters value filled from the serializable request. The handler
 simply have to return a serializable response object in turn.

If any error occurs within this process, than the `errorHandler`
 is responsible for providing the now lacking response object
 based on the error it catches.

And that's it, you have your REST API. We have
 [no middleware](http://insertafter.com/en/blog/no_more_middlewares.html)
 concept here. Instead, every handler is a simple function taking an object
 and returning another one. It makes those objects very easily composable
 (in a functional programming sense).

You may add global wrappers to change every handlers input/output on the
 fly or add a local wrapper specifically to one of a few handlers.

## Contributing

Clone this project's repository and run:

```sh
npm it
```

The repository is based on LernaJS that allows to host several NPM
 packages in a single repository. That said, to keep it simple
 it only proxies the packages commands.

Install those [VSCode extensions](https://insertafter.com/en/blog/my_vscode_configuration.html)
 to get a smooth developer experience.

## Publishing

```sh
NODE_ENV=cli npm run lerna  -- publish
```

[//]: # (::contents:end)

# Authors
- [Nicolas Froidure](http://insertafter.com/en/index.html)

# License
[MIT](https://github.com/nfroidure/whook/blob/master/LICENSE)
