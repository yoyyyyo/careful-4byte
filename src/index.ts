import axios from 'axios';
import { Buffer } from 'buffer';
import { Interface } from '@ethersproject/abi';

interface IAPI4ByteElement {
    id: number;
    created_at: string;
    text_signature: string;
    hex_signature: string;
    bytes_signature: string;
};

export default class Careful4Byte {
    _cache: Record<string, string[]> | null;
    _first: number | null;
    
    constructor(shouldCache = false, first = null) {
        this._first = first;
        this._cache = shouldCache ? {} : null;
    }

    static signatureRegex = /^[0-9a-f]{8}$/

    static extractSelector(input: string) {
        let signature = input.replace('0x', '').slice(0, 8).toLowerCase();
        if (!this.signatureRegex.test(signature))
            return null;

        return signature;
    }

    async _requestSignatures(selector: string, page = 1, count = this._first): Promise<IAPI4ByteElement[]> {
        const request = await axios.get('https://www.4byte.directory/api/v1/signatures/', {
            headers: { 'User-Agent': 'careful-4byte/0.0.2' },
            params: {
                hex_signature: selector,
                page
            }
        });

        const remainingToFetch = count === null ? null : count - request.data.results.length;
        if (typeof request.data.next === 'string' && (remainingToFetch !== null && remainingToFetch > 0)) {
            return [
                ...await this._requestSignatures(
                    selector, page + 1,
                    count === null ? null : remainingToFetch
                ),
                ...request.data.results
            ]
        }

        return request.data.results;
    }

    async getSignatureCandidates(selector: string): Promise<string[]> {
        if (this._cache !== null && this._cache[selector])
            return this._cache[selector];

        const sigs = (await this._requestSignatures(selector))
                        .sort((a, b) => a.id - b.id)
                        .map(a => a.text_signature);

        if (sigs.length > 0 && this._cache !== null)
            this._cache[selector] = sigs;
        
        return sigs;
    }

    async resolve(input: string | Buffer) {
        if (Buffer.isBuffer(input))
            input = input.toString('hex');

        const selector = Careful4Byte.extractSelector(input);
        if (selector === null)
            throw new Error('could not extract signature from input');

        const signatures = await this.getSignatureCandidates(selector);

        for (const signature of signatures) {
            const iface = new Interface([ `function ${signature}` ]);
            try {
                const decoded = iface.decodeFunctionData(signature, input);
                const reencoded = iface.encodeFunctionData(signature, decoded);
                if (reencoded === input)
                    return signature;
            } catch(e) {}
        }

        return null;
    }
}
