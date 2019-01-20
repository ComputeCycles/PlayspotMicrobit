/*
 * Listen to buttons being pressed on the BBC micro:bit
 *
 * Author: Martin Woolley, @bluetooth_mdw
 *
 * Example:
 *
 * sudo node button-listener.js
 *
 * micro:bit hex file must include the Bluetooth Button Service
 *
 * http://bluetooth-mdw.blogspot.co.uk/p/bbc-microbit.html for hex files and micro:bit info
 *
 */

const BBCMicrobit = require('../index'); // or require('bbc-microbit')

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
