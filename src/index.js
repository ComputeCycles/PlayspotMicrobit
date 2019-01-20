const BBCMicrobit = require('./lib/bbc-microbit');

const BUTTON_VALUE_MAPPER = ['Not Pressed', 'Pressed', 'Long Press'];

// search for a micro:bit, to discover a particular micro:bit use:
//  BBCMicrobit.discoverById(id, callback); or BBCMicrobit.discoverByAddress(id, callback);

console.log('Scanning for microbit');
BBCMicrobit.discover((microbit) => {
  console.log('\tdiscovered microbit: id = %s, address = %s', microbit.id, microbit.address);

  microbit.on('disconnect', () => {
    console.log('\tmicrobit disconnected!');
    process.exit(0);
  });

  microbit.on('buttonAChange', (value) => {
    console.log('\ton -> button A change: ', BUTTON_VALUE_MAPPER[value]);
  });

  microbit.on('buttonBChange', (value) => {
    console.log('\ton -> button B change: ', BUTTON_VALUE_MAPPER[value]);
  });

  console.log('connecting to microbit');
  microbit.connectAndSetUp(() => {
    console.log('\tconnected to microbit');

    console.log('subscribing to buttons');
    // to only subscribe to one button use:
    //   microbit.subscribeButtonA();
    // or
    //   microbit.subscribeButtonB();
    microbit.subscribeButtons(() => {
      console.log('\tsubscribed to buttons');
    });
  });
});

module.exports = require('./lib/bbc-microbit');
