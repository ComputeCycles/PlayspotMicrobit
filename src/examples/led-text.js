/*
 * Send text to a micro:bit to display on the LED matrix
 *
 * Author: Martin Woolley, @bluetooth_mdw
 *
 * Example:
 *
 * sudo node led-text.js
 *
 * micro:bit hex file must include the Bluetooth LED Service
 *
 * http://bluetooth-mdw.blogspot.co.uk/p/bbc-microbit.html for hex files and micro:bit info
 */

const BBCMicrobit = require('../index'); // or require('bbc-microbit')

const text = 'Hello there';

// search for a micro:bit, to discover a particular micro:bit use:
//  BBCMicrobit.discoverById(id, callback); or BBCMicrobit.discoverByAddress(id, callback);

console.log('Scanning for microbit');
BBCMicrobit.discover((microbit) => {
  console.log('\tdiscovered microbit: id = %s, address = %s', microbit.id, microbit.address);

  microbit.on('disconnect', () => {
    console.log('\tmicrobit disconnected!');
    process.exit(0);
  });

  console.log('connecting to microbit');
  microbit.connectAndSetUp(() => {
    console.log('\tconnected to microbit');

    console.log('sending text: "%s"', text);
    microbit.writeLedText(text, () => {
      console.log('\ttext sent');

      console.log('disconnecting');
      microbit.disconnect();
    });
  });
});
