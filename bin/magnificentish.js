#!/usr/bin/env node
var Magnificentish = require('../build')
  , argv = require('yargs').argv;

if (require.main === module) {
  var opts = {
    logFile: argv.l || null,
    stdout: argv.s || true,
    healthFreq: argv.f || 3
  };
  var m = new Magnificentish(opts);
  m.startMonitoring().catch(function (err) {
    console.err(err);
  });
}
