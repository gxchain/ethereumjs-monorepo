import tape from 'tape'
import { Address, BN, MAX_INTEGER, setLengthLeft, toBuffer } from 'ethereumjs-util'
import { Block } from '@gxchain2-ethereumjs/block'
import Common, { Chain, Hardfork } from '@gxchain2-ethereumjs/common'
import TxContext from '../../src/evm/txContext'
import Message from '../../src/evm/message'
import EVM from '../../src/evm/evm'
import { setupVM } from './utils'

const testData = require('./testdata/update.json')
const common = new Common({ chain: Chain.Mainnet, hardfork: Hardfork.Berlin })
const genesis = Block.fromRLPSerializedBlock(require('./testdata/blockchain.json').genesisRLP)

function toBN(data: number | string) {
  if (typeof data === 'string' && data.startsWith('0x')) {
    return new BN(data.substr(2), 'hex')
  } else if (data === 'max') {
    return MAX_INTEGER
  }
  return new BN(data)
}

function fromTestData(i: number) {
  const data = testData.messages[i]
  return new Message({
    data: toBuffer(data.data),
    gasLimit: data.gasLimit ? toBN(data.gasLimit) : MAX_INTEGER,
    to: data.to ? Address.fromString(data.to) : Address.zero(),
    contractAddress: data.contractAddress ? Address.fromString(data.contractAddress) : undefined,
  })
}

function functionSelector(name: string) {
  return testData.methods[name]
}

tape('evm.executeUpdate()', async (t) => {
  let contractAddress: Address
  const vm = setupVM({ common })
  const txContext = new TxContext(new BN(0), Address.zero())
  const evm = new EVM(vm, txContext, genesis)

  function makeMessage(name: string, data?: Buffer) {
    return new Message({
      caller: Address.zero(),
      data: Buffer.concat([toBuffer(functionSelector(name)), data ?? Buffer.from('')]),
      gasLimit: MAX_INTEGER,
      to: contractAddress,
    })
  }

  t.test('should deploy succeed', async (t) => {
    const message = fromTestData(0)
    contractAddress = message.contractAddress!
    t.ok(
      (await evm.executeMessage(message)).createdAddress!.equals(contractAddress),
      'contract address should be equal'
    )
    t.end()
  })

  t.test('should correctly return value', async (t) => {
    const message = makeMessage('visit')
    const {
      execResult: { returnValue },
    } = await evm.executeMessage(message)
    t.ok(new BN(returnValue).eqn(1), 'visit value should be equal')
    t.end()
  })

  t.test('should correctly set value', async (t) => {
    const message = makeMessage(
      'set',
      Buffer.concat([setLengthLeft(contractAddress.buf, 32), setLengthLeft(toBuffer(1), 32)])
    )
    await evm.executeMessage(message)
    t.end()
  })

  t.test('should correctly get value', async (t) => {
    const message = makeMessage('get', setLengthLeft(contractAddress.buf, 32))
    const {
      execResult: { returnValue },
    } = await evm.executeMessage(message)
    t.ok(new BN(returnValue).eqn(1), 'get value should be equal')
    t.end()
  })

  t.test('should update succeed', async (t) => {
    const message = fromTestData(1)
    await evm.executeMessage(message)
    t.end()
  })

  t.test('should correctly return value(updated)', async (t) => {
    const message = makeMessage('visit')
    const {
      execResult: { returnValue },
    } = await evm.executeMessage(message)
    t.ok(new BN(returnValue).eqn(2), 'visit value should be equal')
    t.end()
  })

  t.test("shouldn't get value", async (t) => {
    const message = makeMessage('get', setLengthLeft(contractAddress.buf, 32))
    const {
      execResult: { returnValue },
    } = await evm.executeMessage(message)
    t.ok(new BN(returnValue).eqn(0), 'get value should be equal')
    t.end()
  })

  t.test('should correctly set value(updated)', async (t) => {
    const message = makeMessage(
      'set',
      Buffer.concat([setLengthLeft(contractAddress.buf, 32), setLengthLeft(toBuffer(2), 32)])
    )
    await evm.executeMessage(message)
    t.end()
  })

  t.test('should correctly get value(updated)', async (t) => {
    const message = makeMessage('get', setLengthLeft(contractAddress.buf, 32))
    const {
      execResult: { returnValue },
    } = await evm.executeMessage(message)
    t.ok(new BN(returnValue).eqn(2), 'get value should be equal')
    t.end()
  })
})

// Test1
/*
pragma solidity ^0.6.0;

contract Test {
    mapping(address => uint256) private _storage;

    function get(address addr) external view returns (uint256) {
        return _storage[addr];
    }

    function set(address addr, uint256 value) external {
        _storage[addr] = value;
    }

    function visit() external pure returns (uint256) {
        return 1;
    }
}
*/

// Test2
/*
pragma solidity ^0.6.0;

contract Test {
    mapping(address => uint256) private _storage;

    function get(address addr) external view returns (uint256) {
        return _storage[addr];
    }

    function set(address addr, uint256 value) external {
        _storage[addr] = value;
    }

    function visit() external pure returns (uint256) {
        return 2;
    }
}
*/

// compiler: 0.6.2+commit.bacdbe57
// optimization: 200
