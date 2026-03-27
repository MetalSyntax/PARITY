import '@testing-library/jest-dom';

// TextEncoder and TextDecoder are not available in JSDOM, but needed by some React libraries
import { TextEncoder, TextDecoder } from 'util';

Object.assign(global, { TextDecoder, TextEncoder });
