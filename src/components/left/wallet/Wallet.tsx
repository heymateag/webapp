import React, { FC, useEffect, useState } from 'teact/teact';
import WalletConnect from '@walletconnect/client';
import QRCodeModal from '@walletconnect/qrcode-modal';
import useLang from '../../../hooks/useLang';
import { getAccount, getAccountBalance } from './AccountManager/AccountMannager';
import Spinner from '../../ui/Spinner';

import './Wallet.scss';
import Button from '../../ui/Button';
import TransactionRow from './TransactionRow/TransactionRow';
// @ts-ignore
import walletIcon from '../../../assets/heymate/color-wallet.svg';

export type OwnProps = {
  onReset: () => void;
};
interface IAccount {
  address: string;
  privateKey: string;
}
interface IBalance {
  CELO: string;
  cUSD: string;
}
interface IWalletConnect {
  accounts: string[];
  bridge: string;
  chainId: number;
  clientId: string;
  clientMeta: any;
  connected: boolean;
  handshakeId: number;
  handshakeTopic: string;
  key: string;
  peerId: string;
  peerMeta: any;
}
interface IWalletConnectPayLoad {
  accounts: string[];
  chainId: number;
}
const Wallet: FC <OwnProps> = ({ onReset }) => {
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [walletObject, setWalletObject] = useState<IWalletConnectPayLoad>();
  const [account, setAccount] = useState<IAccount>();
  const [balance, setBalance] = useState<IBalance>({
    cUSD: '0',
    CELO: '0',
  });
  const lang = useLang();
  /**
   * BEGIN Wallet Connect Operations To Connect
   */
  const connector = new WalletConnect({
    bridge: 'https://bridge.walletconnect.org', // Required
    qrcodeModal: QRCodeModal,
  });
  if (!connector.connected) {
    // create new session
    connector.createSession();
  } else {
    const { session } = connector;
    setWalletObject({
      accounts: session.accounts, chainId: session.chainId,
    });
  }
  // Subscribe to connection events
  connector.on('connect', (error, payload) => {
    if (error) {
      throw error;
    }
    const { accounts, chainId } = payload.params[0];
    setWalletObject({
      accounts, chainId,
    });
  });
  /**
   * On Wallet Mount
   */
  useEffect(() => {
    getAccount().then((res) => {
      setAccount(res);
    });
  }, []);
  /**
   * Get Account Balance
   */
  useEffect(() => {
    if (account) {
      getAccountBalance(account).then((res) => {
        setLoadingBalance(false);
        setBalance(res);
      });
    }
  }, [account]);
  return (
    <div className="UserWallet">
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
      <div className="wallet-body">
        <div className="logo-container">
          <img src={walletIcon} alt="" />
        </div>
        <span id="total-balance">Total Balance</span>
        {loadingBalance && (
          <div className="spinner-holder">
            <Spinner color="gray" />
          </div>
        )}
        {!loadingBalance && (
          <h3 id="balance">$ {balance.cUSD}</h3>
        )}
        <div className="btn-row">
          <div id="add-money" className="btn-holder">
            <Button size="smaller" color="primary">
              Add Money
            </Button>
          </div>
          <div id="cashout" className="btn-holder">
            <Button isText size="smaller" color="primary">
              <span>Cashout</span>
            </Button>
          </div>
        </div>
      </div>
      <div className="wallet-transactions custom-scroll">
        <h4 id="caption">Transactions</h4>
        <TransactionRow />
        <TransactionRow />
        <TransactionRow />
        <TransactionRow />
        <TransactionRow />
        <TransactionRow />
        <TransactionRow />
        <TransactionRow />
        <TransactionRow />
      </div>
    </div>
  );
};

export default Wallet;
