import B from 'bluebird';
import request from 'request-promise';
import fs from 'fs';

const appendFile = B.promisify(fs.appendFile);
const writeFile = B.promisify(fs.writeFile);

const DEFAULT_OPTS = {
  magnificentPort: 12345,
  logFile: null,
  stdout: true,
  healthFreq: 3
};

const DOWN_THRESHOLD_SECS = 10;

class Magnificentish {

  constructor (opts = {}) {
    Object.assign(this, DEFAULT_OPTS, opts);
    this.monitoring = false;
    this.checks = [];
    this.serverState = true; // true means 'up';
  }

  async startMonitoring () {
    await this.log("Magnificentish monitoring beginning");
    this.monitoring = true;
    if (this.logFile) {
      // TODO should probably append if already exists
      await writeFile(this.logFile, "");
    }
    await this._monitorLoop();
  }

  async stopMonitoring () {
    await this.log("Magnificentish monitoring stopping");
    this.monitoring = false;
  }

  // do a simple up/down check. Returning 'true' means up, 'false' means down
  async doHealthCheck () {
    try {
      await request(`http://localhost:${this.magnificentPort}`);
    } catch (err) {
      // we land here with any kind of socket error or 5xx response
      return false;
    }
    return true;
  }

  async log (msg) {
    msg = `[${(new Date()).toUTCString()}] [MAGS] ${msg}`;
    if (this.logFile) {
      await appendFile(this.logFile, `${msg}\n`);
    }
    if (this.stdout) {
      console.log(msg);
    }
  }

  async printHealth (up, serverState) {
    if (up) {
      await this.log("Server responded OK");
    } else {
      await this.log("Server failed to respond");
    }
    if (serverState !== this.serverState) {
      // serverState changed so we should notify
      if (serverState) {
        await this.log("Server is back UP");
      } else {
        await this.log("Server is DOWN!!!");
      }
    }
  }

  serverIsUp () {
    // if the server has failed to respond for > 10s, say we're down
    if (this.checks.length < 1) {
      // if we don't have any checks, assume we're up
      return true;
    }

    // figure out a cutoff time checks before which we don't care about
    let checkCutoff = Date.now() - (DOWN_THRESHOLD_SECS * 1000);
    // get all checks within the window we care about
    let recentChecks = this.checks.filter(c => c[0] >= checkCutoff);
    // and if any of them are 'up' (true) checks, we are up
    return recentChecks.filter(c => c[1]).length !== 0;
  }

  async _monitorLoop () {
    while (this.monitoring) {
      let checkTime = Date.now();
      // determine whether the server is responding right now, yes/no
      let up = await this.doHealthCheck();
      // keep track of the current state so we can get aggregate data
      this.checks.unshift([checkTime, up]);
      let serverState = this.serverIsUp();
      if (this.logFile || this.stdout) {
        await this.printHealth(up, serverState);
      }
      this.serverState = serverState;
      await B.delay(this.healthFreq * 1000);
    }
  }
}

export default Magnificentish;
