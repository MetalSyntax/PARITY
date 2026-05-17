import { decode, encode } from 'base-64';
import { Buffer } from 'buffer';
import { TextEncoder, TextDecoder } from 'text-encoding';

if (!global.btoa) {
    global.btoa = encode;
}

if (!global.atob) {
    global.atob = decode;
}

if (!global.Buffer) {
    global.Buffer = Buffer as any;
}

if (!global.TextEncoder) {
    global.TextEncoder = TextEncoder;
}

if (!global.TextDecoder) {
    global.TextDecoder = TextDecoder as any;
}
