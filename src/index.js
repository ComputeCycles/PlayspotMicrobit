const mqtt = require('mqtt');
const minilog = require('minilog');
const util = require('util');
const BBCMicrobit = require('../lib/bbc-microbit');

const log = minilog('microbit');
const BUTTON_VALUE_MAPPER = ['Not Pressed', 'Pressed', 'Long Press'];
const BROKER_URL = 'mqtt://localhost';

minilog.enable();

class PlayspotMicrobit {
  /**
   * Construct a Playspot communication object.
   * @param {Runtime} runtime - the Scratch 3.0 runtime
   * @param {string} extensionId - the id of the extension
   */
  constructor(url) {
    this.broker = url || BROKER_URL;
    this.connected = false;
    this.microbits = {};

    /**
     * The most recently received value for each sensor.
     * @type {Object.<string, number>}
     * @private
     */
    this.microbits = {};

    this.onMessage = (topic, payload) => {
      log.info(`onMessage fired for topic: ${topic}, payload: ${payload}`);
      const filterIn = new RegExp('microbit/.*/in/status');
      if (filterIn.test(topic)) {
        // prod all devices to post their status
        const t = topic.split('/');
        if (t[1] === 'all') this.client.publish('microbit/all/out/status', this.microbits);
        else this.client.publish(`microbit/${t[1]}/out/status`, this.microbits[t[1]]);
      }
    };

    this.onConnectTimer = () => {
      if (!this.connected) {
        log.info('connection timeout timer fired');
        this.onError();
      }
    };

    this.onConnect = () => {
      log.info('onConnect fired');
      // subscribe to all status, radar detection and touch events
      clearTimeout(this.performConnectTimeout);
      delete this.performConnectTimeout;
      this.client.subscribe('microbit/+/in/status');
    };

    this.onReconnect = () => {
      log.info('onReconnect fired');
    };

    this.onClose = () => {
      log.info('onClose fired');
      this.connected = false;
      this.closeConnection();
    };

    this.onError = () => {
      log.info('onError fired');
      if (this.client) {
        this.client.end();
      }
      this.closeConnection();
    };

    this.onConnect = this.onConnect.bind(this);
    this.onReconnect = this.onReconnect.bind(this);
    this.onMessage = this.onMessage.bind(this);
    this.onClose = this.onClose.bind(this);
    this.onError = this.onError.bind(this);
    this.onConnectTimer = this.onConnectTimer.bind(this);
  }

  closeConnection() {
    this.connected = false;
    if (this.client === null) return;
    this.client.end(true, () => {
      this.client.removeListener('connect', this.onConnect);
      this.client.removeListener('reconnect', this.onReconnect);
      this.client.removeListener('message', this.onMessage);
      this.client.removeListener('close', this.onClose);
      this.client.removeListener('error', this.onError);
      this.client = null;
    });
  }

  performConnection() {
    log.info('performConnection fired');
    this.client = mqtt.connect(this.broker);
    if (!this.client) this.onError();

    // bind the event handlers
    this.client.on('connect', this.onConnect);
    this.client.on('reconnect', this.onReconnect);
    this.client.on('message', this.onMessage);
    this.client.on('close', this.onClose);
    this.client.on('error', this.onError);
    this.onConnectTimer = this.onConnectTimer.bind(this);

    this.performConnectTimeout = setTimeout(this.onConnectTimer, 10000);
  }

  /**
   * Called to connect to the mqtt server.
   * @param {string} url - the url of the server to connect to.
   */
  connect(url) {
    log.info(`connected fired with url = ${url}`);
    if (url) this.broker = url;
    if (!this.broker) {
      this.onError();
      return;
    }
    log.info(`will connect with = ${this.broker}`);
    if (this.client) {
      // connect to the possibly new broker
      this.client.end(false, this.performConnection.bind(this));
    } else {
      this.performConnection();
    }
  }

  /**
   * Called by the runtime when user wants to connect to a certain peripheral.
   * @param {number} id - the id of the peripheral to connect to.
   */
  disconnect() {
    log.info('disconnecting');
    if (this.client) {
      this.client.end(false, this.removeConnection.bind(this));
    }
  }

  /**
   * Return true if connected to the micro:bit.
   * @return {boolean} - whether the micro:bit is connected.
   */
  isConnected() {
    return this.client && this.connected;
  }
}

const microbitManager = new PlayspotMicrobit();
microbitManager.connect();

// search for a micro:bit, to discover a particular micro:bit use:
//  BBCMicrobit.discoverById(id, callback); or BBCMicrobit.discoverByAddress(id, callback);
log('Scanning for microbit');
BBCMicrobit.discover((microbit) => {
  log(`\tdiscovered microbit: ${microbit._peripheral.advertisement.localName}`);
    var name = 'unknown';
    let name1 = microbit._peripheral.advertisement.localName.split('[');
    if (name1.length > 1) {
	let name2 = name1[1].split(']');
	name = name2[0];
    }
  log(`\tmicrobit shortname: ${name}`);
    microbit.name = name;
    microbit.on('disconnect', () => {
      log(`\tmicrobit: ${name} disconnected!`);
      delete microbitsManager.microbits(microbit.id);
    const status = util.inspect(microbitManager.microbits);
    microbitManager.client.publish('microbit/all/out/status', status);
  });

    microbit.on('accelerometerChange', (x, y, z) => {
	if (x !== microbitManager.microbits[microbit.name].accelerometer.x ||
	    y !== microbitManager.microbits[microbit.name].accelerometer.y ||
	    z !== microbitManager.microbits[microbit.name].accelerometer.z ) {
	    log(
      '\ton -> accelerometer change: accelerometer = %d %d %d G',
      x.toFixed(1),
      y.toFixed(1),
      z.toFixed(1),
    );
    const arr = `[$[x}, ${y}, ${z}]`;
	    microbitManager.microbits[microbit.name].accelerometer = { 'x': x, 'y': y, 'z': z};
	    microbitManager.client.publish(`microbit/${microbit.id}/out/button/b`, arr);
	}
  });

  microbit.on('buttonAChange', (value) => {
    log('\ton -> button A change: ', BUTTON_VALUE_MAPPER[value]);
    const arr = new Uint8Array([value]);
    microbitManager.client.publish(`microbit/${microbit.id}/out/button/a`, arr);
  });

  microbit.on('buttonBChange', (value) => {
    log('\ton -> button B change: ', BUTTON_VALUE_MAPPER[value]);
    const arr = new Uint8Array([value]);
    microbitManager.client.publish(`microbit/${microbit.id}/out/button/b`, arr);
  });

  log('connecting to microbit');
  microbit.connectAndSetUp(() => {
    log('\tconnected to microbit');
      microbitManager.microbits[name] = {
	  address: microbit.address,
	  id: microbit.id,
	  name: name,
	  buttons: {
	      a: 0,
	      b: 0
	  },
	  accelerometer: {
	      x: 0.0,
	      y: 0.0,
	      z: 1.0
	  }
      };
    const status = util.inspect(microbitManager.microbits);
    microbitManager.client.publish('microbit/all/out/status', status);
    log('\tnotified world of status change');
    log('subscribing to buttons');
    microbit.subscribeButtons(() => {
      log('\tsubscribed to buttons');
    });

    const period = 200; // ms
    log('setting accelerometer period to %d ms', period);
    microbit.writeAccelerometerPeriod(period, () => {
      log('\taccelerometer period set');

      log('subscribing to accelerometer');
      microbit.subscribeAccelerometer(() => {
        log('\tsubscribed to accelerometer');
      });
    });
  });
});

module.exports = require('../lib/bbc-microbit');
