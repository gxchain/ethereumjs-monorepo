import tape from 'tape'
import Common, { Hardfork } from '@gxchain2-ethereumjs/common'
import { BlockHeader } from '../src/header'
import { Address, BN, KECCAK256_RLP, KECCAK256_RLP_ARRAY, zeros } from 'ethereumjs-util'
import { Block } from '../src/block'

const common = Common.custom(
  {
    hardforks: [
      {
        name: 'chainstart',
        block: 0,
        forkHash: '0xfc64ec04',
      },
      {
        name: 'homestead',
        block: 1150000,
        forkHash: '0x97c2c34c',
      },
      {
        name: 'dao',
        block: 1920000,
        forkHash: '0x91d1f948',
      },
      {
        name: 'tangerineWhistle',
        block: 2463000,
        forkHash: '0x7a64da13',
      },
      {
        name: 'spuriousDragon',
        block: 2675000,
        forkHash: '0x3edd5b10',
      },
      {
        name: 'byzantium',
        block: 4370000,
        forkHash: '0xa00bc324',
      },
      {
        name: 'constantinople',
        block: 7280000,
        forkHash: '0x668db0af',
      },
      {
        name: 'petersburg',
        block: 7280000,
        forkHash: '0x668db0af',
      },
      {
        name: 'istanbul',
        block: 9069000,
        forkHash: '0x879d6e30',
      },
      {
        name: 'muirGlacier',
        block: 9200000,
        forkHash: '0xe029e991',
      },
      {
        name: 'berlin',
        block: 12244000,
        forkHash: '0x0eb440f6',
      },
      {
        name: 'london',
        block: 12965000,
        forkHash: '0xb715077d',
      },
      {
        name: 'shanghai',
        block: 12965001,
      },
      {
        name: 'merge',
        block: 12965002,
      },
    ],
  },
  { baseChain: 'mainnet', hardfork: Hardfork.Merge }
)

function validateMergeHeader(st: tape.Test, header: BlockHeader) {
  st.ok(header.parentHash.equals(zeros(32)), 'parentHash')
  st.ok(header.uncleHash.equals(KECCAK256_RLP_ARRAY), 'uncleHash')
  st.ok(header.coinbase.equals(Address.zero()), 'coinbase')
  st.ok(header.stateRoot.equals(zeros(32)), 'stateRoot')
  st.ok(header.transactionsTrie.equals(KECCAK256_RLP), 'transactionsTrie')
  st.ok(header.receiptTrie.equals(KECCAK256_RLP), 'receiptTrie')
  st.ok(header.bloom.equals(zeros(256)), 'bloom')
  st.ok(header.difficulty.isZero(), 'difficulty')
  st.ok(header.number.isZero(), 'number')
  st.ok(header.gasLimit.eq(new BN(Buffer.from('ffffffffffffff', 'hex'))), 'gasLimit')
  st.ok(header.gasUsed.isZero(), 'gasUsed')
  st.ok(header.timestamp.isZero(), 'timestamp')
  st.ok(header.extraData.equals(Buffer.from([])), 'extraData')
  st.ok(header.mixHash.equals(zeros(32)), 'mixHash')
  st.ok(header.nonce.equals(zeros(8)), 'nonce')
}

tape('[Header]: Casper PoS / The Merge Functionality', function (t) {
  t.test('should construct default blocks with post-merge PoS constants fields', function (st) {
    const header = BlockHeader.fromHeaderData({}, { common })
    validateMergeHeader(st, header)

    const block = new Block(undefined, undefined, undefined, { common })
    validateMergeHeader(st, block.header)

    st.end()
  })

  t.test('should throw if non merge-conforming PoS constants are provided', function (st) {
    // Building a header with random values for constants
    try {
      const headerData = {
        uncleHash: Buffer.from('123abc', 'hex'),
      }
      BlockHeader.fromHeaderData(headerData, { common })
      st.fail('should throw')
    } catch (e) {
      st.pass('should throw on wrong uncleHash')
    }

    try {
      const headerData = {
        difficulty: new BN(123456),
      }
      BlockHeader.fromHeaderData(headerData, { common })
      st.fail('should throw')
    } catch (e) {
      st.pass('should throw on wrong difficulty')
    }

    try {
      const headerData = {
        extraData: Buffer.from('123abc', 'hex'),
      }
      BlockHeader.fromHeaderData(headerData, { common })
      st.fail('should throw')
    } catch (e) {
      st.pass('should throw on wrong extraData')
    }

    try {
      const headerData = {
        mixHash: Buffer.alloc(32).fill(1),
      }
      BlockHeader.fromHeaderData(headerData, { common })
      st.fail('should throw')
    } catch (e) {
      st.pass('should throw on wrong mixHash')
    }

    try {
      const headerData = {
        nonce: Buffer.alloc(8).fill(1),
      }
      BlockHeader.fromHeaderData(headerData, { common })
      st.fail('should throw')
    } catch (e) {
      st.pass('should throw on wrong nonce')
    }

    st.end()
  })

  t.test('test that a PoS block with uncles cannot be produced', function (st) {
    try {
      new Block(undefined, undefined, [BlockHeader.fromHeaderData(undefined, { common })], {
        common,
      })
      st.fail('should have thrown')
    } catch (e) {
      st.pass('should throw')
    }
    st.end()
  })
})
