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
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [uri, setUri] = useState<string>('');
  const [balanceType, setBalanceType] = useState('cUSD');
  const [transactionList, setTransactionList] = useState([]);

  const provider = useMemo(() => {
    return new WalletConnectProvider({
      rpc: {
        44787: 'https://alfajores-forno.celo-testnet.org',
        42220: 'https://forno.celo.org',
      },
      bridge: 'https://wc-bridge.heymate.works/',
      qrcode: false,
      clientMeta: {
        description: 'Just a test description !',
        icons: [],
        url: 'www.ehsan.com',
        name: 'Heymate App',
      },
    });
  }, []);

  // const [wcProvider, setWcProvider] = useState<any>(provider);
  const handleCLoseWCModal = () => {
    setOpenModal(false);
    provider.isConnecting = false;
    setLoadingBalance(false);
  };

  useWalletConnectQrModal(uri, openModal, handleCLoseWCModal);

  useEffect(() => {
    setWidth(window.innerWidth);
  }, []);

  const [balance, setBalance] = useState<IBalance>({
    cUSD: '0',
    CELO: '0',
    cEUR: '0',
    cREAL: '0',
  });
  const lang = useLang();

  const handleOpenWCModal = async () => {
    if (uri === '') {
      await provider.enable();
    }
    setOpenModal(true);
    // renderUriAsQr();
  };
  /**
   * Get Account Balance
   */
  provider.connector.on('display_uri', (err, payload) => {
    walletLoggerService({
      description: 'start connecting wallet',
      status: 'Waiting',
    });
    setIsConnected(false);
    const wcUri = payload.params[0];

    setUri(wcUri);
    setOpenModal(true);
  });

  const makeKitsFromProvideAndGetBalance = useCallback(async (address?: string) => {
    const reconnectTimeOut = setTimeout(() => {
      if (loadingBalance) {
        showNotification({ message: 'connection failed, please check your connection and retry' });
        setLoadingBalance(false);
        provider.disconnect();
        // setWcProvider(provider);
        window.location.reload();
      }
    }, 60000);
    // @ts-ignore
    const web3 = new Web3(provider);
    // @ts-ignore
    const myKit = newKitFromWeb3(web3);

    const walletAddress = address || provider.accounts[0];

    const accounts = await myKit.web3.eth.getAccounts();
    // eslint-disable-next-line prefer-destructuring
    myKit.defaultAccount = accounts[0];
    await myKit.setFeeCurrency(CeloContract.StableToken);
    const accountBalance = await newKitBalances(myKit, walletAddress);
    clearTimeout(reconnectTimeOut);
    setBalance(accountBalance);

    setLoadingBalance(false);

    setKit(myKit);
    // setWcProvider(provider);
  }, [provider]);

  provider.on('disconnect', (code: number, reason: string) => {
    showNotification({ message: reason });
    setIsConnected(false);
    // setWcProvider(provider);
  });

  provider.onConnect(() => {
    walletLoggerService({
      description: 'connected wallet',
      status: 'Success',
    });
    setOpenModal(false);
    setIsConnected(true);
    showNotification({ message: 'Successfully Connected to Wallet !' });
    // setWcProvider(provider);
    makeKitsFromProvideAndGetBalance();
    WalletConnectQRCodeModal.close();
  });

  const getTransactions = useCallback(async () => {
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
  }, [kit?.web3?.utils, provider.accounts, provider.chainId]);

  useEffect(() => {
    const reconnectToProvider = async () => {
      await provider.enable()
        .then((res) => {
          setIsConnected(true);
          makeKitsFromProvideAndGetBalance(res[0]);
        });
    };
    if (provider.isWalletConnect) {
      reconnectToProvider();
    } else {
      setLoadingBalance(false);
    }
  }, [makeKitsFromProvideAndGetBalance, provider]);

  useEffect(() => {
    if (kit) {
      getTransactions();
    }
  }, [getTransactions, kit]);

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
                <Button onClick={handleOpenWCModal} isText size="smaller" color="primary">
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
