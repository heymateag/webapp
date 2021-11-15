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
    await Promise.reject(err);
  }
  const receipt = await tx.waitReceipt();
  return  receipt;
};
