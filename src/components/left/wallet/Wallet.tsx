import React, {
  FC, useEffect, useState, memo, useMemo, useCallback,
} from 'teact/teact';
import WalletConnectProvider from '@walletconnect/web3-provider';
import Web3 from 'web3';
import { newKitFromWeb3, CeloContract } from '@celo/contractkit';
import { withGlobal } from 'teact/teactn';
import WalletConnectQRCodeModal from '@walletconnect/qrcode-modal';
import { newKitBalances } from './AccountManager/AccountMannager';
import useLang from '../../../hooks/useLang';
import Spinner from '../../ui/Spinner';
import './Wallet.scss';
import Button from '../../ui/Button';
import TransactionRow from './TransactionRow/TransactionRow';
// @ts-ignore
import walletIcon from '../../../assets/heymate/color-wallet.svg';
import { GlobalActions } from '../../../global/types';
import { pick } from '../../../util/iteratees';
import Select from '../../ui/Select';
import { axiosService } from '../../../api/services/axiosService';
import walletLoggerService from '../../common/helpers/walletLoggerService';
import { useWalletConnectQrModal } from './hooks/useWalletConnectQrModal';

export type OwnProps = {
  onReset: () => void;
};

interface IBalance {
  CELO: string;
  cUSD: string;
  cEUR: string;
  cREAL: string;
}

type DispatchProps = Pick<GlobalActions, 'showNotification'>;

const Wallet: FC <OwnProps & DispatchProps> = ({ onReset, showNotification }) => {
  const [openModal, setOpenModal] = useState(false);
  const [kit, setKit] = useState<any>();
  const [width, setWidth] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [uri, setUri] = useState<string>('');
  const [balanceType, setBalanceType] = useState('cUSD');
  const [transactionList, setTransactionList] = useState([]);
  const [provider, setProvider] = useState<any>();
  const [balance, setBalance] = useState<IBalance>({
    cUSD: '0',
    CELO: '0',
    cEUR: '0',
    cREAL: '0',
  });
  const connect = async () => {
    const providerItem = new WalletConnectProvider({
      rpc: {
        44787: 'https://alfajores-forno.celo-testnet.org',
        42220: 'https://forno.celo.org',
      },
      bridge: 'https://wc-bridge.heymate.works/',
    });
    walletLoggerService({
      description: 'start connecting wallet',
      status: 'Waiting',
    });
    await providerItem.enable();
    setLoadingBalance(true);
    // showNotification({ message: 'Successfully Connected to Wallet !' });
    const web3 = new Web3(providerItem);
    const myKit = newKitFromWeb3(web3);
    // eslint-disable-next-line prefer-destructuring
    myKit.defaultAccount = providerItem.accounts[0];
    const accounts = await myKit.web3.eth.getAccounts();
    // eslint-disable-next-line prefer-destructuring
    myKit.defaultAccount = accounts[0];
    await myKit.setFeeCurrency(CeloContract.StableToken);
    const accountBalance = await newKitBalances(myKit, accounts[0]);
    setBalance(accountBalance);
    setLoadingBalance(false);
    setKit(myKit);
    setProvider(providerItem);
    setIsConnected(true);
    providerItem.on('accountsChanged', (act) => {
      console.log(act);
    });
    providerItem.onConnect(() => {
      walletLoggerService({
        description: 'connected wallet',
        status: 'Success',
      });
      setIsConnected(true);
      showNotification({ message: 'Successfully Connected to Wallet !' });
    });
  };

  useEffect(() => {
    setWidth(window.innerWidth);
    connect();
  }, []);


  const lang = useLang();


  const getTransactions = async () => {
    const baseURL = provider.chainId !== 44787
      ? 'https://explorer.celo.org/'
      : 'https://alfajores-blockscout.celo-testnet.org/';
    const url = `${baseURL}api?module=account&action=tokentx&page=0&offset=50&address=${provider.accounts[0]}`;
    const response = await axiosService({
      url,
      method: 'GET',
      body: {},
    });
    const weiEther = kit?.web3?.utils?.toWei('1', 'ether');
    const filter = response.data.result.filter((row) => (row.value / weiEther) > 0.01);
    setTransactionList(filter);
  };

  useEffect(() => {
    if (kit) {
      getTransactions();
    }
  }, [provider, kit]);

  const handleChangeCurrency = (e: any) => {
    const filter = e.target.value;
    setBalanceType(filter);
  };

  return (
    <div className="UserWallet">
      {width <= 500
      && (
        <div className="left-header">
          <Button
            round
            size="smaller"
            color="translucent"
            onClick={onReset}
            ariaLabel="Return to chat list"
          >
            <i className="icon-arrow-left" />
          </Button>
          <h3>{lang('Wallet')}</h3>
        </div>
      )}
      <div className="wallet-body">
        <div className="logo-container">
          <img src={walletIcon} alt="" />
        </div>
        {(!loadingBalance && isConnected) && (
          <>
            <div className="currency-select">
              <Select
                label="Currency"
                placeholder="Currency"
                onChange={handleChangeCurrency}
                value={balanceType}
                hasArrow={Boolean(true)}
                id="status-filter"
              >
                <option value="cUSD">cUSD</option>
                <option value="cEUR">cEUR</option>
                <option value="cREAL">cREAL</option>
                <option value="CELO">CELO</option>
              </Select>
            </div>
          </>
        )}
        {isConnected
        && (
          <div>
            <span id="total-balance">Total Balance</span>
            {balanceType === 'cUSD' && <h3 id="balance">$ {parseFloat(balance.cUSD).toFixed(2)}</h3>}
            {balanceType === 'cEUR' && <h3 id="balance">€ {parseFloat(balance.cEUR).toFixed(2)}</h3>}
            {balanceType === 'cREAL' && <h3 id="balance">R$ {parseFloat(balance.cREAL).toFixed(2)}</h3>}
            {balanceType === 'CELO' && <h3 id="balance">CELO {parseFloat(balance.CELO).toFixed(2)}</h3>}
          </div>
        )}
        {loadingBalance && (
          <div className="spinner-holder">
            <Spinner color="gray" />
          </div>
        )}
        {(!loadingBalance && !isConnected) && (
          <span id="balance">Connect Your Account</span>
        )}

        {
          (!loadingBalance && !isConnected)
          && (
            <div className="btn-row">
              <div id="cashout" className="btn-holder">
                <Button onClick={connect} isText size="smaller" color="primary">
                  <span>Connect</span>
                </Button>
              </div>
            </div>
          )
        }
      </div>
      <div className="wallet-transactions custom-scroll">
        <h4 id="caption">Transactions</h4>
        {
          transactionList.map((name: any) => {
            return (
              <TransactionRow
                key={name.timeStamp}
                value={name.value}
                weiEther={kit?.web3?.utils?.toWei('1', 'ether')}
                from={name.from}
                to={name.to}
                timeStamp={name.timeStamp}
                tokenSymbol={name.tokenSymbol}
                address={provider.accounts[0]}
              />
            );
          })
        }
      </div>
      {/* <QrCodeDialog */}
      {/*  uri={uri} */}
      {/*  openModal={openModal} */}
      {/*  onCloseModal={handleCLoseWCModal} */}
      {/*  loadingQr={loadingQr} */}
      {/*  qrCodeRef={qrCodeRef} */}
      {/* /> */}

    </div>
  );
};

export default memo(withGlobal<OwnProps>(
  (): any => {
    return {
    };
  },
  (setGlobal, actions): DispatchProps => pick(actions, [
    'showNotification',
  ]),
)(Wallet));
