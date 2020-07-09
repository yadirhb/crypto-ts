import { BufferedBlockAlgorithm } from './BufferedBlockAlgorithm';
import { HMAC } from '../algorithms/hmac';
import { WordArray } from '.';

export interface ConcreteHasher {
  create(...args: any[]): BaseHasher;
  new (): Hasher;
}

export interface Hasher {
  /**
   * Resets this hasher to its initial state.
   *
   * @example
   *
   *     hasher.reset();
   */
  reset: () => void;

  /**
   * Updates this hasher with a message.
   *
   * @param {WordArray|string} messageUpdate The message to append.
   *
   * @return {BaseHasher} This hasher.
   *
   * @example
   *
   *     hasher.update('message');
   *     hasher.update(wordArray);
   */
  update: (messageUpdate: string | WordArray) => void;

  /**
   * Finalizes the hash computation.
   * Note that the finalize operation is effectively a destructive, read-once operation.
   *
   * @param {WordArray|string} messageUpdate (Optional) A final message update.
   *
   * @return {WordArray} The hash.
   *
   * @example
   *
   *     const hash = hasher.finalize();
   *     const hash = hasher.finalize('message');
   *     const hash = hasher.finalize(wordArray);
   */
  finalize: (messageUpdate?: string | WordArray) => WordArray;
}

/**
 * Abstract hasher template.
 *
 * @property {number} blockSize The number of 32-bit words this hasher operates on. Default: 16 (512 bits)
 */
export abstract class BaseHasher extends BufferedBlockAlgorithm
  implements Hasher {
  protected abstract doReset(): any;
  protected abstract doFinalize(): WordArray;

  protected hash!: WordArray;

  protected constructor() {
    super(512 / 32);
  }

  /**
   * Resets this hasher to its initial state.
   *
   * @example
   *
   *     hasher.reset();
   */
  reset() {
    // Reset data buffer
    super.reset();

    // Perform concrete-hasher logic
    this.doReset();
  }

  /**
   * Updates this hasher with a message.
   *
   * @param {WordArray|string} messageUpdate The message to append.
   *
   * @return {BaseHasher} This hasher.
   *
   * @example
   *
   *     hasher.update('message');
   *     hasher.update(wordArray);
   */
  update(messageUpdate: string | WordArray) {
    // Append
    this.append(messageUpdate);

    // Update the hash
    this.process();

    // Chainable
    return this;
  }

  /**
   * Finalizes the hash computation.
   * Note that the finalize operation is effectively a destructive, read-once operation.
   *
   * @param {WordArray|string} messageUpdate (Optional) A final message update.
   *
   * @return {WordArray} The hash.
   *
   * @example
   *
   *     const hash = hasher.finalize();
   *     const hash = hasher.finalize('message');
   *     const hash = hasher.finalize(wordArray);
   */
  finalize(messageUpdate?: string | WordArray): WordArray {
    // Final message update
    if (messageUpdate) {
      this.append(messageUpdate);
    }

    // Perform concrete-hasher logic
    const hash = this.doFinalize();

    return hash;
  }
}

/**
 * Creates a shortcut function to a hasher's object interface.
 *
 * @param {BaseHasher} hasher The hasher to create a helper for.
 *
 * @return {Function} The shortcut function.
 *
 * @static
 *
 * @example
 *
 *     const SHA256 = CryptoJS.lib.Hasher._createHelper(CryptoJS.algo.SHA256);
 */
export function _createHelper(hasher: ConcreteHasher) {
  return function(message: string, args: any[]) {
    return hasher.create(...args).finalize(message);
  };
}

/**
 * Creates a shortcut function to the HMAC's object interface.
 *
 * @param {BaseHasher} hasher The hasher to use in this HMAC helper.
 *
 * @return {Function} The shortcut function.
 *
 * @static
 *
 * @example
 *
 *     const HmacSHA256 = CryptoJS.lib.Hasher._createHmacHelper(CryptoJS.algo.SHA256);
 */
export function _createHmacHelper(hasher: ConcreteHasher) {
  return function(message: string | WordArray, key: string | WordArray) {
    return HMAC.create(hasher, key).finalize(message);
  };
}
