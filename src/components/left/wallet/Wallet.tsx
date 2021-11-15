import React, {
  FC, useEffect, useRef, useState, memo, useMemo, useCallback,
} from 'teact/teact';
import { WalletConnectWallet } from '@celo/wallet-walletconnect';
import QrCreator from 'qr-creator';
import useLang from '../../../hooks/useLang';
import { newKitBalances, getAccountBalance } from './AccountManager/AccountMannager';
import Spinner from '../../ui/Spinner';
import Modal from '../../ui/Modal';
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

const Wallet: FC <OwnProps> = ({ onReset }) => {
  const [openModal, setOpenModal] = useState(false);
  const [loadingQr, setLoadingQr] = useState(true);
  // eslint-disable-next-line no-null/no-null
  const qrCodeRef = useRef<HTMLDivElement>(null);

  const [loadingBalance, setLoadingBalance] = useState(true);
  const walletObj = new WalletConnectWallet({
    connect: {
      metadata: {
        name: 'Heymate Dapp',
        description: 'Dapp Description',
        url: 'https://www.example.com',
        icons: ['https://www.example.com/favicon.ico'],
      },
    },
  });

  const [balance, setBalance] = useState<IBalance>({
    cUSD: '0',
    CELO: '0',
  });
  const lang = useLang();

  const connect = async () => {
    const container = qrCodeRef.current!;

    container.innerHTML = '';
    container.classList.remove('pre-animate');

    const uri = await walletObj.getUri();
    console.log(uri);
    QrCreator.render({
      text: `${uri}`,
      radius: 0.5,
      ecLevel: 'M',
      fill: '#4E96D4',
      size: 280,
    }, container);
    setLoadingQr(false);
    await walletObj.init().catch((e) => {
      alert(e.message);
    });
  };

  const handleCLoseWCModal = () => {
    setOpenModal(false);
  };

  const handleOpenWCModal = () => {
    setOpenModal(true);
    setLoadingQr(true);
    setTimeout(() => {
      connect();
    }, 100);
  };
  /**
   * Get Account Balance
   */

  walletObj.onSessionDeleted = () => {
    alert('session deleted !');
    localStorage.removeItem('wc_session');
    localStorage.removeItem('wallet');
  };

  walletObj.onSessionCreated = (session) => {
    alert('session Created !');
    localStorage.setItem('wc-session', JSON.stringify(session));
    setOpenModal(false);
  };

  useEffect(() => {
    const reconnect = async () => {
      await walletObj.init().then((value) => {
        newKitBalances(walletObj);
      });
    };
    reconnect();
  }, [walletObj]);
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
        {(!loadingBalance && balance.cUSD !== '0') ? (
          <h3 id="balance">$ {balance.cUSD}</h3>
        ) : (
          <span id="balance">Connect Your Account</span>
        )}
        <div className="btn-row">
          <div id="add-money" className="btn-holder">
            <Button size="smaller" color="primary">
              Add Money
            </Button>
          </div>
          <div id="cashout" className="btn-holder">
            <Button onClick={handleOpenWCModal} isText size="smaller" color="primary">
              <span>Connect</span>
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
      <Modal
        hasCloseButton
        isOpen={openModal}
        onClose={handleCLoseWCModal}
        onEnter={openModal ? handleCLoseWCModal : undefined}
        className="WalletQrModal"
        title="Wallet Connect"
      >
        {loadingQr && (
          <div className="spinner-holder">
            <Spinner color="blue" />
          </div>
        )}
        <div key="qr-container" className="qr-container pre-animate" ref={qrCodeRef} />
      </Modal>
    </div>
  );
};

export default memo(Wallet);
