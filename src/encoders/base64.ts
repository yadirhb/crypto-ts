import { Encoder } from '.';
import { WordArray } from '../lib';

function parseLoop(
  base64Str: string,
  base64StrLength: number,
  reverseMap: number[]
) {
  const words: number[] = [];
  let nBytes = 0;
  for (let i = 0; i < base64StrLength; i++) {
    if (i % 4) {
      const bits1 = reverseMap[base64Str.charCodeAt(i - 1)] << ((i % 4) * 2);
      const bits2 = reverseMap[base64Str.charCodeAt(i)] >>> (6 - (i % 4) * 2);
      const bitsCombined = bits1 | bits2;
      words[nBytes >>> 2] |= bitsCombined << (24 - (nBytes % 4) * 8);
      nBytes++;
    }
  }
  return WordArray.create(words, nBytes);
}

export const Base64: Encoder = class Base64 {
  private static map: string =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  private static reverseMap: number[] = [];

  /**
   * Generates a WordArray from a Base64 string.
   * @param input Base64 String
   */
  static parse(input: string): WordArray {
    // Shortcuts
    let base64StrLength = input.length;
    const map = Base64.map;
    const reverseMap = Base64.reverseMap;

    if (reverseMap.length === 0) {
      for (let j = 0; j < map.length; j++) {
        reverseMap[map.charCodeAt(j)] = j;
      }
    }

    // Ignore padding
    const paddingChar = map.charAt(64);
    if (paddingChar) {
      const paddingIndex = input.indexOf(paddingChar);
      if (paddingIndex !== -1) {
        base64StrLength = paddingIndex;
      }
    }

    // Convert
    return parseLoop(input, base64StrLength, reverseMap);
  }
  static stringify(wordArray: WordArray): string {
    // Shortcuts
    const words = wordArray.words;
    const sigBytes = wordArray.sigBytes;
    const map = Base64.map;

    // Clamp excess bits
    wordArray.clamp();

    // Convert
    const base64Chars = [];
    for (var i = 0; i < sigBytes; i += 3) {
      const byte1 = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
      const byte2 = (words[(i + 1) >>> 2] >>> (24 - ((i + 1) % 4) * 8)) & 0xff;
      const byte3 = (words[(i + 2) >>> 2] >>> (24 - ((i + 2) % 4) * 8)) & 0xff;

      const triplet = (byte1 << 16) | (byte2 << 8) | byte3;

      for (let j = 0; j < 4 && i + j * 0.75 < sigBytes; j++) {
        base64Chars.push(map.charAt((triplet >>> (6 * (3 - j))) & 0x3f));
      }
    }

    // Add padding
    const paddingChar = map.charAt(64);
    if (paddingChar) {
      while (base64Chars.length % 4) {
        base64Chars.push(paddingChar);
      }
    }

    return base64Chars.join('');
  }
};
