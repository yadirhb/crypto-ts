import { WordArray } from './WordArray';
import { UTF8 } from '../encoders';
import { Base } from './Base';

/**
 * Abstract buffered block algorithm template.
 *
 * The property blockSize must be implemented in a concrete subtype.
 *
 * @property {number} minBufferSize The number of blocks that should be kept unprocessed in the buffer. Default: 0
 */
export abstract class BufferedBlockAlgorithm extends Base {
  protected data!: WordArray;
  protected nDataBytes!: number;
  protected minBufferSize: number = 0;

  public readonly blockSize: number;

  protected constructor(blockSize: number = 0) {
    super();
    this.blockSize = blockSize;
  }

  protected abstract doProcessBlock(data: WordArray, offset: number): void;

  /**
   * Creates a copy of this object.
   *
   * @return {Object} The clone.
   *
   * @example
   *
   *     var clone = bufferedBlockAlgorithm.clone();
   */
  clone() {
    const clone = super.clone();
    clone.data = this.data.clone();

    return clone;
  }

  /**
   * Resets this block algorithm's data buffer to its initial state.
   *
   * @example
   *
   *     bufferedBlockAlgorithm.reset();
   */
  reset() {
    // Initial values
    this.data = WordArray.create();
    this.nDataBytes = 0;
  }

  /**
   * Adds new data to this block algorithm's buffer.
   *
   * @param {WordArray|string} data The data to append. Strings are converted to a WordArray using UTF-8.
   *
   * @example
   *
   *     bufferedBlockAlgorithm.append('data');
   *     bufferedBlockAlgorithm.append(wordArray);
   */
  protected append(data: string | WordArray) {
    // Convert string to WordArray, else assume WordArray already
    if (typeof data == 'string') {
      data = UTF8.parse(data);
    }

    // Append
    this.data.concat(data);
    this.nDataBytes += data.sigBytes;
  }

  /**
   * Processes available data blocks.
   *
   * This method invokes doProcessBlock(offset), which must be implemented by a concrete subtype.
   *
   * @param {boolean} doFlush Whether all blocks and partial blocks should be processed.
   *
   * @return {WordArray} The processed data.
   *
   * @example
   *
   *     var processedData = bufferedBlockAlgorithm._process();
   *     var processedData = bufferedBlockAlgorithm._process(!!'flush');
   */
  process(doFlush: boolean = false) {
    let processedWords;

    // Shortcuts
    const data = this.data;
    const dataWords = data.words;
    const dataSigBytes = data.sigBytes;
    const blockSize = this.blockSize;
    const blockSizeBytes = blockSize * 4;

    // Count blocks ready
    let nBlocksReady = dataSigBytes / blockSizeBytes;
    if (doFlush) {
      // Round up to include partial blocks
      nBlocksReady = Math.ceil(nBlocksReady);
    } else {
      // Round down to include only full blocks,
      // less the number of blocks that must remain in the buffer
      nBlocksReady = Math.max((nBlocksReady | 0) - this.minBufferSize, 0);
    }

    // Count words ready
    const nWordsReady = nBlocksReady * blockSize;

    // Count bytes ready
    const nBytesReady = Math.min(nWordsReady * 4, dataSigBytes);

    // Process blocks
    if (nWordsReady) {
      for (let offset = 0; offset < nWordsReady; offset += blockSize) {
        // Perform concrete-algorithm logic
        this.doProcessBlock(data, offset);
      }

      // Remove processed words
      processedWords = (dataWords as number[]).splice(0, nWordsReady);
      data.sigBytes -= nBytesReady;
    }

    // Return processed words
    return WordArray.create(processedWords, nBytesReady);
  }
}
