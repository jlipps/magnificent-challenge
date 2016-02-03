// transpile:mocha

import Magnificentish from '..';
import { SubProcess } from 'teen_process';
import B from 'bluebird';
import fs from 'fs';

import chai from 'chai';
import path from 'path';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';

const should = chai.should();
chai.use(chaiAsPromised);

const readFile = B.promisify(fs.readFile);

describe('Magnificentish', () => {
  const serverPath = path.resolve(__dirname, '..', '..', 'magnificent',
                                  'server.py');
  const logFile = path.resolve(__dirname, 'test_output.log');
  let serverProc;

  before(async () => {
    serverProc = new SubProcess('python', [serverPath]);
    await serverProc.start(1000);
  });

  after(async () => {
    await serverProc.stop();
  });

  it('should be exported', () => {
    should.exist(Magnificentish);
  });

  it('should come with useful defaults', () => {
    let m = new Magnificentish({logFile});
    should.exist(m.magnificentPort);
    should.exist(m.logFile);
    should.exist(m.stdout);
    should.exist(m.healthFreq);
    m.logFile.should.eql(logFile);
  });

  it('should be able to do a simple health check', async () => {
    let m = new Magnificentish({stdout: false});
    let health = await m.doHealthCheck();
    (typeof health).should.equal('boolean');
  });

  it('should be able to heuristically determine whether server is up', () => {
    let clock = sinon.useFakeTimers(15000);
    let m = new Magnificentish({stdout: false});

    // with no checks we are 'up'
    m.checks = [];
    m.serverIsUp().should.equal(true);

    // with one recent 'up' check we are 'up'
    m.checks = [[10000, true]];
    m.serverIsUp().should.equal(true);

    // with one recent 'down' check we are 'down'
    m.checks = [[10000, false]];
    m.serverIsUp().should.equal(false);

    // with one recent 'down' check but a previous 'up' check we are 'up'
    m.checks = [[10000, false], [9000, true]];
    m.serverIsUp().should.equal(true);

    // with one recent 'down' check but a later 'up' check we are 'up'
    m.checks = [[10000, false], [12000, true]];
    m.serverIsUp().should.equal(true);

    // with one old 'down' check we are 'down'
    m.checks = [[3000, false]];
    m.serverIsUp().should.equal(false);

    clock.restore();
  });

  it('should be able to print the health of the server', async () => {
    let m = new Magnificentish({stdout: false});
    let spy = sinon.stub(m, "log", async (msg) => {
      return msg;
    });

    await m.printHealth(true, true);
    spy.getCall(0).args[0].should.contain("OK");
    should.not.exist(spy.getCall(1));

    m.serverState = false;
    await m.printHealth(true, true);
    spy.getCall(1).args[0].should.contain("OK");
    spy.getCall(2).args[0].should.contain("UP");

    await m.printHealth(false, false);
    spy.getCall(3).args[0].should.contain("failed to respond");
    should.not.exist(spy.getCall(4));
  });

  it('should run a monitoring loop until asked to stop', async () => {
    let m = new Magnificentish({stdout: false, healthFreq: 1});
    let healthCheckCall = 0;
    let stub = sinon.stub(m, "doHealthCheck", async () => {
      healthCheckCall++;
      switch (healthCheckCall) {
        case 1: return false;
        case 2: return true;
        case 3: return true;
        case 4: return true;
      }
    });
    let p = m.startMonitoring();
    await B.delay(3500);
    await m.stopMonitoring();
    await p;
    stub.callCount.should.equal(4);
    let checks = m.checks.map(m => m[1]);
    checks.should.eql([true, true, true, false]);
  });

  it('should log to a file if asked', async () => {
    let m = new Magnificentish({stdout: false, healthFreq: 1, logFile});
    sinon.stub(m, "doHealthCheck", async () => {
      return true;
    });
    let p = m.startMonitoring();
    await B.delay(1000);
    await m.stopMonitoring();
    await p;
    (await readFile(logFile)).toString("utf8").should.contain("OK");
  });

});
