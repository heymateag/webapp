import React, {
  FC, useEffect, useRef, useState,
} from 'teact/teact';
import { WalletConnectWallet } from '@celo/wallet-walletconnect';
import QrCreator from 'qr-creator';
import useLang from '../../../hooks/useLang';
import { getAccount, getAccountBalance } from './AccountManager/AccountMannager';
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

interface IWalletConnectPayLoad {
  accounts: string[];
  chainId: number;
}
const Wallet: FC <OwnProps> = ({ onReset }) => {
  const [openModal, setOpenModal] = useState(false);
  // eslint-disable-next-line no-null/no-null
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const [walletUri, setWalletUri] = useState<any>('');
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [walletObject, setWalletObject] = useState<IWalletConnectPayLoad>();
  const [account, setAccount] = useState<IAccount>();
  const [balance, setBalance] = useState<IBalance>({
    cUSD: '0',
    CELO: '0',
  });
  const lang = useLang();
  /**
   * Init Celo Wallet Connect
   */
  const connect = async () => {
    const wallet = new WalletConnectWallet({
      connect: {
        metadata: {
          name: 'The name of your awesome DApp',
          description: 'Your DApp description',
          url: 'https://example.com',
          icons: ['https://example.com/favicon.ico'],
        },
      },
    });
    const container = qrCodeRef.current!;
    // container.innerHTML = '';
    container.classList.remove('pre-animate');
    const uri = await wallet.getUri();
    setWalletUri(uri);
    QrCreator.render({
      text: `${uri}`,
      radius: 0.5,
      ecLevel: 'M',
      fill: '#4E96D4',
      size: 280,
    }, container);
    setOpenModal(true);
  };

  const handleCLoseWCModal = () => {
    setOpenModal(false);
  };

  const handleOpenWCModal = () => {
    setOpenModal(true);
    setTimeout(() => {
      connect();
    }, 100);
  };

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
        className="BookOfferModal"
        title="Wallet Connect"
      >
        <div key="qr-container" className="qr-container pre-animate" ref={qrCodeRef} />
      </Modal>
    </div>
  );
};

export default Wallet;
