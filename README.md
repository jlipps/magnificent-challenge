Magnificentish
===================

This is a daemon that monitors the health of the Magnificent server!

## Design goals

* Log output to any file whenever we determine a significant event has happened with the Magnificent server
    * server is down
    * server is up after being down
    * server health notice every X seconds
* Provide a JSON REST API for queries about the health of the Magnificent server
* Allow Magnificentish to be restarted and not lose its data

## Transpile & run tests

```
gulp once
```
