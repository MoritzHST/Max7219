/**
 * MAX7219 Abstraction for tessel 2
 *
 * implemented by Moritz Wilke
 *
 * for more information visit the Datasheet at
 *  https://www.sparkfun.com/datasheets/Components/General/COM-09622-MAX7219-MAX7221.pdf
 */


var Matrix = function () {
    /**
     * Constructor for the Max7219
     * @param spi tessel 2 spi instance (f.e. tessel.Port.A.SPI; Set cpha and cpol flags to 0, chipSelect is required)
     * @constructor
     */
    function Matrix(spi, devices) {
        this._spi = spi;
        this._devices = devices;
    }

    Matrix.prototype._write = function (device, register, data) {
        if (!(register >= 0x00 && register <= 0xFF && data >= 0x00 && data <= 0xFF)) {
            return;
        }

        //Since the Max7219 always pushes data to the next device when it receives data we need to do some tricks
        //We push enough NO-OP's into the buffer so that we spam the "old" instruction out of the register
        //Then we send the actual instruction to the device
        //After that we probably need to send some NO-OP's again depending on which device our aim is
        return new Promise(async resolve => {
            //new Array for Buffer to transfer Data
            var transferBuffer = [];
            var spi = this._spi;
            var devices = this._devices;
            for (let i = 1; i < devices; i++) {
                transferBuffer.push(registers.OP_NO_OP);
                transferBuffer.push(registers.OP_NO_OP);
            }
            //Always send register first followed by data
            transferBuffer.push(register);
            transferBuffer.push(data);
            //Depending on which MAX7219 is going to receive Data we need to push NO_OP_CODES (16 Bit -> twice)
            for (let i = 1; i < device; i++) {
                transferBuffer.push(registers.OP_NO_OP);
                transferBuffer.push(registers.OP_NO_OP);
            }

            spi.send(new Buffer(transferBuffer), function () {
                delay(1);
                resolve(true);
            })


        })
    };

    /**
     * Sets the ScanLimit for a certain device
     * @param device device to receive instruction
     * @param limit Scan limit to be set for the device (range from 0x0 to 0x7)
     */
    Matrix.prototype.setScanLimit = function (device, limit) {
        return this._write(device, registers.OP_SCAN_LIMIT, limit);
    };

    /**
     * Sets the intensity for a certain device
     * @param device device to receive instruction
     * @param intensity Initensity to be set for the device (range from 0x0 to 0xF)
     */
    Matrix.prototype.setIntensity = function (device, intensity) {
        return this._write(device, registers.OP_INTENSITY, intensity);
    };

    /**
     * (De-)Activates the DisplayTest for a certain Device
     * @param device device to receive instruction
     * @param enabled Boolean Value to set the DisplayTest on (True) or off (False)
     */
    Matrix.prototype.setDisplayTest = function (device, enabled) {
        var data = enabled ? 0x1 : 0x0;
        return this._write(device, registers.OP_DISPLAY_TEST, data);
    };

    /**
     * Writes Data to a column/row of the device
     * @param device device to receive instruction
     * @param column column to be set
     * @param data data to be send
     */
    Matrix.prototype.writeColumn = function (device, column, data) {
        if (column < 1 || column > 8) {
            return;
        }
        var register;
        switch (column) {
            case 1 :
                register = registers.OP_DIGIT_0;
                break;
            case 2 :
                register = registers.OP_DIGIT_1;
                break;
            case 3 :
                register = registers.OP_DIGIT_2;
                break;
            case 4 :
                register = registers.OP_DIGIT_3;
                break;
            case 5 :
                register = registers.OP_DIGIT_4;
                break;
            case 6 :
                register = registers.OP_DIGIT_5;
                break;
            case 7 :
                register = registers.OP_DIGIT_6;
                break;
            case 8 :
                register = registers.OP_DIGIT_7;
                break;
        }

        return this._write(device, register, data);
    };

    Matrix.prototype.enableDisplay = function (device, enabled) {
        var data = enabled ? 1 : 0;
        return this._write(device, registers.OP_SHUTDOWN, data);
    };

    /**
     * Sets the DecodeMode of a device
     * @param device device to receive instruction
     * @param mode DecodeMode ( 0x0 no decode
     *                          0x1 Code B decode for digit 0, No decode for digits 7–1
     *                          0xf Code B decode for digits 3–0, No decode for digits 7–4
     *                          0xff Code B decode for digits 7–0 )
     */
    Matrix.prototype.setDecodeMode = function (device, mode) {
        return this._write(device, registers.OP_DECODE, mode);
    };

    /**
     * Clears Column on all Devices
     * @param device the device we want to clear in the chain
     * @returns {Promise<any>}
     */
    Matrix.prototype.clearDisplay = function (device) {
        var curDevice = this;
        return new Promise(async resolve => {
            //Set each row to 0 -> cleared Display :)
            for (let i = 1; i <= 8; i++) {
                await curDevice.writeColumn(device, i, 0x00);
            }
            resolve(true);
        });
    };


    var registers = {
        OP_NO_OP: 0x0,
        OP_DIGIT_0: 0x1,
        OP_DIGIT_1: 0x2,
        OP_DIGIT_2: 0x3,
        OP_DIGIT_3: 0x4,
        OP_DIGIT_4: 0x5,
        OP_DIGIT_5: 0x6,
        OP_DIGIT_6: 0x7,
        OP_DIGIT_7: 0x8,
        OP_DECODE: 0x9,
        OP_INTENSITY: 0xA,
        OP_SCAN_LIMIT: 0xB,
        OP_SHUTDOWN: 0xC,
        OP_DISPLAY_TEST: 0xF
    };

    /**
     * Source: https://gist.github.com/thelostspore/67f9b3f0ab97d6d05516
     * @param ms
     */
    function delay(ms) {
        var e = new Date().getTime() + (ms);
        while (new Date().getTime() <= e) {
            ;
        }
        ;
    }

    return Matrix;
}();


module.exports = Matrix;
