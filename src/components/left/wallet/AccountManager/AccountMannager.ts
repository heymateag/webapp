import Web3 from 'web3';
import { newKitFromWeb3 } from '@celo/contractkit';

interface IAccount {
  address: string;
  privateKey: string;
}
/**
 * Crete New Account For User
 */
const createAccount = () => {
  // @ts-ignore
  const web3 = new Web3(process.env.CELO_NET_URL);
  const client = newKitFromWeb3(web3);

  const account = web3.eth.accounts.create();
  const userAccount = JSON.stringify(account);
  localStorage.setItem('account', userAccount);
  return account;
};
/**
 * Get User Account
 */
export const getAccount = async () => {
  if (localStorage.getItem('account')) {
    const account = localStorage.getItem('account') as string;
    return JSON.parse(account);
  } else {
    const account = await createAccount();
    return account;
  }
};

/**
 * Get User Account Balance
 */
export const getAccountBalance = async (account: IAccount) => {
  // Initialize account from our private key
  // @ts-ignore
  const web3 = new Web3(process.env.CELO_NET_URL);
  const client = newKitFromWeb3(web3);
  const userAccount = web3.eth.accounts.privateKeyToAccount(account.privateKey);
  // 1. Query account balances
  const accountBalances = await client.getTotalBalance(userAccount.address)
    .catch((err) => { throw new Error(`Could not fetch account: ${err}`); });
  let temp = {
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
