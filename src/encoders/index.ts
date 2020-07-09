import { WordArray } from "../lib/WordArray";
export * from "./hex";
export * from "./base64";
export * from "./utf8";
export * from "./latin1";

export interface Encoder {
  parse(input: string): WordArray;
  stringify(wordArray: WordArray): string;
}
