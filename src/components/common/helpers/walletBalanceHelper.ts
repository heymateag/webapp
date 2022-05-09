import { axiosService } from '../../../api/services/axiosService';

const getWalletBalanceByAddress = async (address: string, currency?: string) => {
  const baseURL = false
    ? 'https://explorer.celo.org/'
    : 'https://alfajores-blockscout.celo-testnet.org/';
  const url = `${baseURL}api?module=account&action=tokenlist&address=${address}`;
  const response = await axiosService({
    url,
    method: 'GET',
    body: {},
  });
  const data: any = {};
  response.data.result.forEach((item) => {
    const balance = (item.balance / (Math.pow(10, item.decimals))).toFixed(2);
    data[item.symbol] = balance;
  });
  if (currency) {
    if (currency === 'USD') {
      return data['cUSD'];
    }
  } else {
    return data;
  }
};
export default getWalletBalanceByAddress;
