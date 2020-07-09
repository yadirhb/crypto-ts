import { HasherClass, Hasher } from '../lib/Hasher';
import { WordArray } from '../lib';

// Initialization and round constants tables
const H: any[] = [];
const K: number[] = [];

// Compute constants
(function() {
  function isPrime(n: number) {
    const sqrtN = Math.sqrt(n);
    for (let factor = 2; factor <= sqrtN; factor++) {
      if (!(n % factor)) {
        return false;
      }
    }

    return true;
  }

  function getFractionalBits(n: number) {
    return ((n - (n | 0)) * 0x100000000) | 0;
  }

  let n = 2;
  let nPrime = 0;
  while (nPrime < 64) {
    if (isPrime(n)) {
      if (nPrime < 8) {
        H[nPrime] = getFractionalBits(Math.pow(n, 1 / 2));
      }
      K[nPrime] = getFractionalBits(Math.pow(n, 1 / 3));

      nPrime++;
    }

    n++;
  }
})();

// Reusable object
const W: any[] = [];

export const SHA256: HasherClass = class SHA256 extends Hasher {
  private constructor() {
    super();
  }
  static create() {
    return new SHA256();
  }
  protected doReset() {
    this.hash = WordArray.create(H.slice(0));
  }

  protected doProcessBlock(M: WordArray, offset: number) {
    // Shortcut
    var H = this.hash.words;

    // Working variables
    let a = H[0];
    let b = H[1];
    let c = H[2];
    let d = H[3];
    let e = H[4];
    let f = H[5];
    let g = H[6];
    let h = H[7];

    // Computation
    for (let i = 0; i < 64; i++) {
      if (i < 16) {
        W[i] = M.words[offset + i] | 0;
      } else {
        const gamma0x = W[i - 15];
        const gamma0 =
          ((gamma0x << 25) | (gamma0x >>> 7)) ^
          ((gamma0x << 14) | (gamma0x >>> 18)) ^
          (gamma0x >>> 3);

        const gamma1x = W[i - 2];
        const gamma1 =
          ((gamma1x << 15) | (gamma1x >>> 17)) ^
          ((gamma1x << 13) | (gamma1x >>> 19)) ^
          (gamma1x >>> 10);

        W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16];
      }

      const ch = (e & f) ^ (~e & g);
      const maj = (a & b) ^ (a & c) ^ (b & c);

      const sigma0 =
        ((a << 30) | (a >>> 2)) ^
        ((a << 19) | (a >>> 13)) ^
        ((a << 10) | (a >>> 22));
      const sigma1 =
        ((e << 26) | (e >>> 6)) ^
        ((e << 21) | (e >>> 11)) ^
        ((e << 7) | (e >>> 25));

      const t1 = h + sigma1 + ch + K[i] + W[i];
      const t2 = sigma0 + maj;

      h = g;
      g = f;
      f = e;
      e = (d + t1) | 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) | 0;
    }

    // Intermediate hash value
    H[0] = (H[0] + a) | 0;
    H[1] = (H[1] + b) | 0;
    H[2] = (H[2] + c) | 0;
    H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0;
    H[5] = (H[5] + f) | 0;
    H[6] = (H[6] + g) | 0;
    H[7] = (H[7] + h) | 0;
  }

  protected doFinalize() {
    // Shortcuts
    var data = this.data;
    var dataWords = data.words;

    const nBitsTotal = this.nDataBytes * 8;
    const nBitsLeft = data.sigBytes * 8;

    // Add padding
    dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - (nBitsLeft % 32));
    dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = Math.floor(
      nBitsTotal / 0x100000000
    );
    dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 15] = nBitsTotal;
    data.sigBytes = dataWords.length * 4;

    // Hash final blocks
    this.process();

    // Return final computed hash
    return this.hash;
  }

  clone() {
    const clone = super.clone();
    clone.hash = this.hash.clone();

    return clone;
  }
};
