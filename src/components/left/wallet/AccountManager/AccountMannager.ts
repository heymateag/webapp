import web3 from 'web3';
/**
 * Get New Kit Balances
 */
export const newKitBalances = async (kit:any, address: string) => {
  const accountBalances = await kit.getTotalBalance(address)
    .catch((err) => { throw new Error(`Could not fetch account: ${err}`); });
  const temp = {
    CELO: '0',
    cUSD: '0',
  };

  if (accountBalances) {
    // @ts-ignore
    temp.CELO = web3.utils.fromWei(accountBalances.CELO.toString());
    // @ts-ignore
    temp.cUSD = web3.utils.fromWei(accountBalances.cUSD.toString());
  }
  return temp;
  // console.log('Locked CELO balance: ', accountBalances.lockedCELO.toString(10));
  // console.log('Pending balance: ', accountBalances.pending.toString(10));
};

export const sendcUSD = async (kit) => {
  const amount = kit.web3.utils.toWei('0.001', 'ether');

  const stabletoken = await kit.contracts.getStableToken();
  let tx;
  try {
    tx = await stabletoken.transfer('0xcedc9b7d6c225257ef87f06d17af1f9ac7d50aa6', amount).send();
  } catch (err) {
    console.log(err);
    await Promise.reject(err);
  }
  const receipt = await tx.getHash();
  return receipt;
};

// {blockHash: '0x1a7ca84f60aee2bb5c41287b46636972003774eb8dcfdc2d062d869c11cc22ca', blockNumber: 8794866, contractAddress: null, cumulativeGasUsed: 94653, from: '0xc845b6308e814b20c53315a4726ccd8511a3c2a4', …}
// blockHash: "0x1a7ca84f60aee2bb5c41287b46636972003774eb8dcfdc2d062d869c11cc22ca"
// blockNumber: 8794866
// contractAddress: null
// cumulativeGasUsed: 94653
// events: {Transfer: Array(3)}
// from: "0xc845b6308e814b20c53315a4726ccd8511a3c2a4"
// gasUsed: 94653
// logsBloom: "0x00000000000020000000000000000000000000000000000000000000000000000000000002004000000002000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000010000000000000000800000000000000000000000000400000000000000000000400000000000000000000008000000000000000000000000000000000000000000100000000000002000200000000000000000000000000000020080000000000000800000000040000000000000000000000000000000000000000000000000000000000"
// status: true
// to: "0x874069fa1eb16d44d622f2e0ca25eea172369bc1"
// transactionHash: "0xfeda9d884603bcc1686ca87afb51c34799e0490db6e466b05967cee7bbbbf4d8"
// transactionIndex: 0
