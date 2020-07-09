import * as alg from './algorithms';
import * as enc from './encoders';
import { _createHmacHelper } from './lib/Hasher';

const HmacSHA256 = _createHmacHelper(alg.SHA256);
export default { alg, enc, HmacSHA256 };
