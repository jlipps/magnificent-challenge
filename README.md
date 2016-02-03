Magnificentish
===================

This is a daemon that monitors the health of the Magnificent server!

## Design goals

* Log output to any file whenever we determine a significant event has happened with the Magnificent server
    * server is down
    * server is up after being down
    * server health notice every X seconds
* TODO: Provide a JSON REST API for queries about the health of the Magnificent server
* TODO: Allow Magnificentish to be restarted and not lose its data

## Installation

```
# clone, then:
npm install -g gulp gulp-cli
npm install # this will get deps and transpile code
```

## CLI Usage

```
./bin/magnificentish.js # assumes a running magnificent server
```

Options:

```
-l: path to log file
-f: health check frequency
```

## Programmatic Usage

```js
import Magnificentish from 'magnificentish'; // if this were on npm

async function foo () {
  var m = new Magnificentish();
  let up = await m.doHealthCheck(); // get up/down
  m.startMonitoring(); // start the monitoring loop
  m.stopMonitoring(); // stop monitoring loop;
}
```

## Transpile & run tests

```
gulp once
```
