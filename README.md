# careful-4byte
[npm](https://npmjs.com/package/careful-4byte) | [github](https://github.com/yoyyyyo/careful-4byte)
4byte.dictionary + semi-strict calldata checking = careful-4byte

## usage
```js
import Careful4Byte from 'careful-4byte';
const careful4byte = new Careful4Byte(true);

await careful4byte.resolve('0xe1c7392a')
    // => returns init()

await careful4byte.resolve('0x42966c68000000000000000000000000000000000000000000084595161401484a000000')
    // => returns burn(uint256) (instead of collate_propagate_storage(bytes16))

await careful4byte.resolve('0x60806040523480156100105...')
    // => returns null
```
