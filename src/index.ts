import * as alg from './algorithms';
import * as enc from './encoders';
import { Hasher } from 'lib/Hasher';

const HmacSHA256 = Hasher._createHmacHelper(alg.SHA256);
export default { alg, enc, HmacSHA256 };
