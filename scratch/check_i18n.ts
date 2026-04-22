
import { misc as en } from './i18n/en/misc';
import { misc as es } from './i18n/es/misc';
import { misc as pt } from './i18n/pt/misc';

const enKeys = Object.keys(en);
const esKeys = Object.keys(es);
const ptKeys = Object.keys(pt);

console.log('Missing in ES:', enKeys.filter(k => !esKeys.includes(k)));
console.log('Missing in PT:', enKeys.filter(k => !ptKeys.includes(k)));
console.log('Missing in EN (but in ES):', esKeys.filter(k => !enKeys.includes(k)));
console.log('Missing in EN (but in PT):', ptKeys.filter(k => !enKeys.includes(k)));
