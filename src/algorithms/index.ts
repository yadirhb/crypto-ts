import { Hasher } from "../lib/Hasher";
import { SHA256 } from "./sha256";

export const HmacSHA256 = Hasher._createHmacHelper(SHA256);
