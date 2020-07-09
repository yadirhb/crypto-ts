import { WordArray } from '../lib';
import { UTF8 } from '../encoders';
import { BaseHasher, ConcreteHasher } from '../lib/Hasher';

/**
 * HMAC algorithm.
 */
export class HMAC {
  private oKey!: WordArray;
  private iKey!: WordArray;
  private constructor(private hasher: BaseHasher, key: WordArray) {
    // Shortcuts
    const hasherBlockSize = hasher.blockSize;
    const hasherBlockSizeBytes = hasherBlockSize * 4;

    // Allow arbitrary length keys
    if (key.sigBytes > hasherBlockSizeBytes) {
      key = hasher.finalize(key);
    }

    // Clamp excess bits
    key.clamp();

    // Clone key for inner and outer pads
    const oKey = (this.oKey = key.clone());
    const iKey = (this.iKey = key.clone());

    // Shortcuts
    const oKeyWords = oKey.words;
    const iKeyWords = iKey.words;

    // XOR keys with pad constants
    for (let i = 0; i < hasherBlockSize; i++) {
      oKeyWords[i] ^= 0x5c5c5c5c;
      iKeyWords[i] ^= 0x36363636;
    }
    oKey.sigBytes = iKey.sigBytes = hasherBlockSizeBytes;

    // Set initial values
    this.reset();
  }

  /**
   * Initializes a newly created HMAC.
   *
   * @param {BaseHasher} hasher The hash algorithm to use.
   * @param {WordArray|string} key The secret key.
   *
   * @example
   *
   *     var hmacHasher = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, key);
   */
  static create(hasher: ConcreteHasher, key: WordArray | string) {
    // Convert string to WordArray, else assume WordArray already
    if (typeof key == 'string') {
      key = UTF8.parse(key);
    }

    return new HMAC(hasher.create(), key as WordArray);
  }

  /**
   * Resets this HMAC to its initial state.
   *
   * @example
   *
   *     hmacHasher.reset();
   */
  reset() {
    // Shortcut
    var hasher = this.hasher;

    // Reset
    hasher.reset();
    hasher.update(this.iKey);
  }

  /**
   * Updates this HMAC with a message.
   *
   * @param {WordArray|string} messageUpdate The message to append.
   *
   * @return {HMAC} This HMAC instance.
   *
   * @example
   *
   *     hmacHasher.update('message');
   *     hmacHasher.update(wordArray);
   */
  update(messageUpdate: string | WordArray) {
    this.hasher.update(messageUpdate);

    // Chainable
    return this;
  }

  /**
   * Finalizes the HMAC computation.
   * Note that the finalize operation is effectively a destructive, read-once operation.
   *
   * @param {WordArray|string} messageUpdate (Optional) A final message update.
   *
   * @return {WordArray} The HMAC.
   *
   * @example
   *
   *     var hmac = hmacHasher.finalize();
   *     var hmac = hmacHasher.finalize('message');
   *     var hmac = hmacHasher.finalize(wordArray);
   */
  finalize(messageUpdate?: string | WordArray) {
    // Shortcut
    const hasher = this.hasher;

    // Compute HMAC
    const innerHash = hasher.finalize(messageUpdate!);
    hasher.reset();
    const hmac = hasher.finalize(this.oKey.clone().concat(innerHash));

    return hmac;
  }
}
