// import "react-native-get-random-values";
import { Encoder } from "../encoders";
import { Hex } from "../encoders/hex";
import uuid from "uuid-random";
/*
 * Cryptographically secure pseudorandom number generator
 *
 * As Math.random() is cryptographically not safe to use
 */
function cryptoSecureRandomInt() {
  return uuid.bin()[0];
  // return crypto.getRandomValues(new Uint32Array(1))[0];
}

type TypedArray =
  | number[]
  | ArrayBuffer
  | Int8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array;

/**
 * An array of 32-bit words.
 *
 * @property {number} sigBytes The number of significant bytes in this word array.
 */
export class WordArray {
  private constructor(
    public words: number[] | Uint8Array = [],
    public sigBytes: number = words.length * 4
  ) {}

  static create(words: TypedArray = [], sigBytes?: number): WordArray {
    if (words instanceof ArrayBuffer) words = new Uint8Array(words);

    // Convert other array views to uint8
    if (
      words instanceof Int8Array ||
      words instanceof Uint8ClampedArray ||
      words instanceof Int16Array ||
      words instanceof Uint16Array ||
      words instanceof Int32Array ||
      words instanceof Uint32Array ||
      words instanceof Float32Array ||
      words instanceof Float64Array
    ) {
      words = new Uint8Array(words.buffer, words.byteOffset, words.byteLength);
    }

    // Handle Uint8Array
    if (words instanceof Uint8Array) {
      // Shortcut
      const typedArrayByteLength = words.byteLength;

      // Extract bytes
      const wordsAux: number[] = [];
      for (var i = 0; i < typedArrayByteLength; i++) {
        wordsAux[i >>> 2] |= words[i] << (24 - (i % 4) * 8);
      }

      // Initialize this word array
      return new WordArray(wordsAux, typedArrayByteLength);
    }
    return new WordArray(words as number[], sigBytes);
  }

  /**
   * Creates a copy of this word array.
   *
   * @return {WordArray} The clone.
   *
   * @example
   *
   *     var clone = wordArray.clone();
   */
  clone(): WordArray {
    return WordArray.create([...this.words], this.sigBytes);
  }

  /**
   * Removes insignificant bits.
   *
   * @example
   *
   *     wordArray.clamp();
   */
  clamp() {
    // Shortcuts
    const words = this.words;
    const sigBytes = this.sigBytes;

    words[sigBytes >>> 2] &= 0xffffffff << (32 - (sigBytes % 4) * 8);
    words.length = Math.ceil(sigBytes / 4);
  }

  /**
   * Converts this word array to a string.
   *
   * @param {Encoder} encoder (Optional) The encoding strategy to use. Default: CryptoJS.enc.Hex
   *
   * @return {string} The stringified word array.
   *
   * @example
   *
   *     var string = wordArray + '';
   *     var string = wordArray.toString();
   *     var string = wordArray.toString(CryptoJS.enc.Utf8);
   */
  toString(encoder?: Encoder): string {
    return (encoder! || Hex).stringify(this);
  }

  /**
   * Concatenates a word array to this word array.
   *
   * @param {WordArray} wordArray The word array to append.
   *
   * @return {WordArray} This word array.
   *
   * @example
   *
   *     wordArray1.concat(wordArray2);
   */
  concat(wordArray: WordArray) {
    // Shortcuts
    const thisWords = this.words;
    const thatWords = wordArray.words;
    const thisSigBytes = this.sigBytes;
    const thatSigBytes = wordArray.sigBytes;

    // Clamp excess bits
    this.clamp();

    // Concat
    if (thisSigBytes % 4) {
      // Copy one byte at a time
      for (let i = 0; i < thatSigBytes; i++) {
        const thatByte = (thatWords[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
        thisWords[(thisSigBytes + i) >>> 2] |=
          thatByte << (24 - ((thisSigBytes + i) % 4) * 8);
      }
    } else {
      // Copy one word at a time
      for (let i = 0; i < thatSigBytes; i += 4) {
        thisWords[(thisSigBytes + i) >>> 2] = thatWords[i >>> 2];
      }
    }

    this.sigBytes += thatSigBytes;

    // Chainable
    return this;
  }

  /**
   * Creates a word array filled with random bytes.
   *
   * @param {number} nBytes The number of random bytes to generate.
   *
   * @return {WordArray} The random word array.
   *
   * @static
   *
   * @example
   *
   *     var wordArray = CryptoJS.lib.WordArray.random(16);
   */
  static random(nBytes: number): WordArray {
    var words: number[] = [];

    for (var i = 0; i < nBytes; i += 4) {
      words.push(cryptoSecureRandomInt());
    }

    return WordArray.create(words, nBytes);
  }
}
