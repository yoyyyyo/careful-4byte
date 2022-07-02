"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const buffer_1 = require("buffer");
const abi_1 = require("@ethersproject/abi");
;
class Careful4Byte {
    constructor(shouldCache = false, first = null) {
        this._first = first;
        this._cache = shouldCache ? {} : null;
    }
    static extractSelector(input) {
        let signature = input.replace('0x', '').slice(0, 8).toLowerCase();
        if (!this.signatureRegex.test(signature))
            return null;
        return signature;
    }
    _requestSignatures(selector, page = 1, count = this._first) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = yield axios_1.default.get('https://www.4byte.directory/api/v1/signatures/', {
                headers: { 'User-Agent': 'careful-4byte/0.1.0' },
                params: {
                    hex_signature: selector,
                    page
                }
            });
            const remainingToFetch = count === null ? null : count - request.data.results.length;
            if (typeof request.data.next === 'string' && (remainingToFetch !== null && remainingToFetch > 0)) {
                return [
                    ...yield this._requestSignatures(selector, page + 1, count === null ? null : remainingToFetch),
                    ...request.data.results
                ];
            }
            return request.data.results;
        });
    }
    getSignatureCandidates(selector) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._cache !== null && this._cache[selector])
                return this._cache[selector];
            const sigs = (yield this._requestSignatures(selector))
                .sort((a, b) => a.id - b.id)
                .map(a => a.text_signature);
            if (sigs.length > 0 && this._cache !== null)
                this._cache[selector] = sigs;
            return sigs;
        });
    }
    resolve(input) {
        return __awaiter(this, void 0, void 0, function* () {
            if (buffer_1.Buffer.isBuffer(input))
                input = input.toString('hex');
            const selector = Careful4Byte.extractSelector(input);
            if (selector === null)
                throw new Error('could not extract signature from input');
            const signatures = yield this.getSignatureCandidates(selector);
            for (const signature of signatures) {
                const iface = new abi_1.Interface([`function ${signature}`]);
                try {
                    const decoded = iface.decodeFunctionData(signature, input);
                    const reencoded = iface.encodeFunctionData(signature, decoded);
                    if (reencoded === input)
                        return signature;
                }
                catch (e) { }
            }
            return null;
        });
    }
}
exports.default = Careful4Byte;
Careful4Byte.signatureRegex = /^[0-9a-f]{8}$/;