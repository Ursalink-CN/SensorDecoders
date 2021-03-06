// UC11XX Payload Decoder
function Decoder(bytes, port) {
    var decoded = {};


    for (i = 0; i < bytes.length;) {
        // GPIO INPUT 1
        if (bytes[i] == 0x01) {
            decoded.din1 = bytes[i + 2] === 0 ? "off" : "on";
            i += 3;
            continue;
        }

        // GPIO INPUT 2
        if (bytes[i] == 0x02) {
            decoded.din2 = bytes[i + 2] === 0 ? "off" : "on";
            i += 3;
            continue;
        }

        // GPIO OUTPUT 1
        if (bytes[i] == 0x09) {
            decoded.dout1 = bytes[i + 2] === 0 ? "off" : "on";
            i += 3;
            continue;
        }

        // GPIO OUTPUT 2
        if (bytes[i] == 0x0a) {
            decoded.dout2 = bytes[i + 2] === 0 ? "off" : "on";
            i += 3;
            continue;
        }

        // ADC OUTPUT 1
        if (bytes[i] == 0x11) {
            decoded.ain1 = {};
            decoded.ain1.cur = readInt16LE(bytes.slice(i + 2, i + 4)) / 100;
            decoded.ain1.min = readInt16LE(bytes.slice(i + 4, i + 6)) / 100;
            decoded.ain1.max = readInt16LE(bytes.slice(i + 6, i + 8)) / 100;
            decoded.ain1.avg = readInt16LE(bytes.slice(i + 8, i + 10)) / 100;
            i += 10;
            continue;
        }


        if (bytes[i] == 0x12) {
            decoded.ain2 = {};
            decoded.ain2.cur = readInt16LE(bytes.slice(i + 2, i + 4)) / 100;
            decoded.ain2.min = readInt16LE(bytes.slice(i + 4, i + 6)) / 100;
            decoded.ain2.max = readInt16LE(bytes.slice(i + 6, i + 8)) / 100;
            decoded.ain2.avg = readInt16LE(bytes.slice(i + 8, i + 10)) / 100;
            i += 10;
            continue;
        }


        // MODBUS
        if (bytes[i] == 0xFF && (bytes[i + 1] == 0x0E || bytes[i + 1] == 0x19)) {
            var chnId = bytes[i + 2];
            var packageType = bytes[i + 3];
            var dataType, dataLength;
            if (bytes[i + 1] == 0x0E) {
                dataType = packageType & 7;
                dataLength = packageType >> 3;
            } else {
                dataType = bytes[i + 3];
                dataLength = bytes[i + 4];
            }

            var chn = 'chn' + chnId;
            switch (dataType) {
                case 0:
                case 1:
                    decoded[chn] = bytes[i + 4] ? "on" : "off";
                    i += 5;
                    break;
                case 2:
                case 3:
                case 8:
                case 9:
                case 10:
                case 11:
                    decoded[chn] = readUInt16LE(bytes.slice(i + 4, i + 6));
                    i += 6;
                    break;
                case 4:
                case 6:
                    decoded[chn] = readUInt32LE(bytes.slice(i + 4, i + 8));
                    i += 8;
                    break;
                case 5:
                case 7:
                    decoded[chn] = readFloatLE(bytes.slice(i + 4, i + 8));
                    i += 8;
                    break;
            }
        }
    }


    return decoded;
}


/* ******************************************
* bytes to number
********************************************/
function readUInt8LE(bytes) {
    return (bytes & 0xFF);
}


function readInt8LE(bytes) {
    var ref = readUInt8LE(bytes);
    return (ref > 0x7F) ? ref - 0x100 : ref;
}


function readUInt16LE(bytes) {
    var value = (bytes[1] << 8) + bytes[0];
    return (value & 0xFFFF);
}


function readInt16LE(bytes) {
    var ref = readUInt16LE(bytes);
    return (ref > 0x7FFF) ? ref - 0x10000 : ref;
}


function readUInt32LE(bytes) {
    var value = (bytes[3] << 24) + (bytes[2] << 16) + (bytes[1] << 8) + bytes[0];
    return (value & 0xFFFFFFFF);
}


function readInt32LE(bytes) {
    var ref = readUInt32LE(bytes);
    return (ref > 0x7FFFFFFF) ? ref - 0x100000000 : ref;
}


function readFloatLE(bytes) {
    // JavaScript bitwise operators yield a 32 bits integer, not a float.
    // Assume LSB (least significant byte first).
    var bits = bytes[3] << 24 | bytes[2] << 16 | bytes[1] << 8 | bytes[0];
    var sign = (bits >>> 31 === 0) ? 1.0 : -1.0;
    var e = bits >>> 23 & 0xff;
    var m = (e === 0) ? (bits & 0x7fffff) << 1 : (bits & 0x7fffff) | 0x800000;
    var f = sign * m * Math.pow(2, e - 150);
    return f;
}
