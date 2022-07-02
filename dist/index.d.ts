/// <reference types="node" />
import { Buffer } from 'buffer';
interface IAPI4ByteElement {
    id: number;
    created_at: string;
    text_signature: string;
    hex_signature: string;
    bytes_signature: string;
}
export default class Careful4Byte {
    _cache: Record<string, string[]> | null;
    _first: number | null;
    constructor(shouldCache?: boolean, first?: null);
    static signatureRegex: RegExp;
    static extractSelector(input: string): string | null;
    _requestSignatures(selector: string, page?: number, count?: number | null): Promise<IAPI4ByteElement[]>;
    getSignatureCandidates(selector: string): Promise<string[]>;
    resolve(input: string | Buffer): Promise<string | null>;
}
export {};