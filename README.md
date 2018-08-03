# Max7219 for Tessel 2

## How to use
```JavaScript
//import tessel
const tessel = require('tessel');
//import the max7219.js
const disp = require('max7219.js');
//define the SPI-Pins
let port = tessel.port.A;
let spi = new port.SPI({
    clockSpeed: 5 * 1000 * 1000,
    cpol: 0,
    cpha: 0,
    chipSelect: port.pin[7]
});
//Initialize the Matrix (4 devices/8x8-displays in this case)
let matrix = new disp(spi, 4);

//Initialize first Display
matrix.setDecodeMode(1, 0x00)
    .then(_ => {
        return matrix.setScanLimit(1, 0x07);
    })
    .then(_ => {
        return matrix.enableDisplay(1, true);
    })
//Write something to the first Device
    .then(_ => {
        return matrix.writeColumn(1, 1, 0xAA);
    })
```
