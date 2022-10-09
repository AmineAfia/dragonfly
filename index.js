import { Kafka } from '@upstash/kafka'
import ethers from "ethers"

export class Dragon {
  kafka = new Kafka({
    url: 'https://distinct-mallard-8932-us1-rest-kafka.upstash.io',
    username: 'ZGlzdGluY3QtbWFsbGFyZC04OTMyJHlygI3oyKeaIdw5j9SIVL6gRCNm1tPTEbk',
    password:
      'aM8YECeyHqENyMri8L7uCRrYvkYg77XFb3R1BE08RF1croHMp-TxQnlrGDJzMcP6lYMPKg==',
  })

  constructor(contractName, abi) {
    this.contractName = contractName
    this.abi = abi
  }

  _ingest = (message, topic) => {

    const p = this.kafka.producer()
    console.log(message)
    return p.produce(topic, JSON.stringify(message))
  }

  _fetchSig = async (error) => {
    const errorSig = error.data.originalError.data
    const req = await fetch(
      `https://sig.eth.samczsun.com/api/v1/signatures?all=true&function=${errorSig}`,
    )
    const data = req.json()
    return data
  }

  _getSignatureNames = (obj) => {
    return Object.values(obj)[0]?.map((e) => {
      return e.name
    })[0]
  }

  async error(error, transaction) {
    const errorSig = await this._fetchSig(error)
    
    const message = {
      error: {
        eventErrors: this._getSignatureNames(errorSig.result.event),
        transactionError: this._getSignatureNames(errorSig.result.function),
      },
      transaction: transaction,
      contract: this.contractName,
    }

    return this._ingest(message, "errors")
  }

  async wallet(address, value) {
    // Import environment variables
    const baseUrl = "https://goerli.ethereum.coinbasecloud.net";
    const username = "7BDXXFEFG5X5NAYXYWML";
    const password = "SNGZTWLEPV2VYHSWDSEPPRQIQQFT7Z6QAG3NWNBH";

    // Create node provider using project credentials
    const provider = new ethers.providers.JsonRpcProvider({
      url: baseUrl,
      user: username,
      password : password
    })

    const balance = await provider.getBalance(address)

    const message = {
      wallet: address,
      txsValue: ethers.utils.formatEther(ethers.BigNumber.from(value).toBigInt()),
      balance: ethers.utils.formatEther(balance.toBigInt())
    }

    return this._ingest(message, "wallets")
  }

  intents() {
    return `intents`
  }
}

// const dd = new Dragon("contract2", 'someABI')
// // test error
// const pp = {
//   transaction: {
//     from: '0x0aaA82DfDF58D1e7e2DA272eda4942e27d787f4b',
//     to: '0x84866CCf525128a8290c10031CEf0B4B98EA5C69',
//     value: { type: 'BigNumber', hex: '0x1ff973cafa8000' },
//     data:
//       '0x457391e56f5d5c68e12b6b17d29e7a7a7c5e4e9f301d00e68abeb312b3b911b3f43dda22',
//     accessList: null,
//   },

//   error: {
//     code: -32603,
//     message: 'execution reverted',
//     data: {
//       originalError: {
//         code: 3,
//         data: '0xf0a42d4c',
//         message: 'execution reverted',
//       },
//     },
//   },
// }
// console.log(dd.error(pp.error, pp.transaction))

// // test wallet
// console.log(dd.wallet(pp.transaction.from, pp.transaction.value.hex))
