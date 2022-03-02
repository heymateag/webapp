/* eslint-disable no-null/no-null */
import React, {
  FC, useEffect,
} from 'teact/teact';
import WalletConnectQRCodeModal from '@walletconnect/qrcode-modal';
import useLang from '../../hooks/useLang';
import Modal from '../ui/Modal';
// import Button from '../ui/Button';
import './QrCodeDialog.scss';
import Spinner from '../ui/Spinner';
import renderText from './helpers/renderText';
import useWindowSize from '../../hooks/useWindowSize';
import { MOBILE_SCREEN_MAX_WIDTH } from '../../config';

type OwnProps = {
  openModal: boolean;
  loadingQr: boolean;
  qrCodeRef: any;
  uri: any;
  onCloseModal: () => void;
};

const QrCodeDialog: FC<OwnProps> = ({
  openModal = false,
  loadingQr = false,
  qrCodeRef,
  onCloseModal,
  uri,
}) => {
  const lang = useLang();
  const { width: windowWidth } = useWindowSize();

  const handleCLoseWCModal = () => {
    onCloseModal();
    WalletConnectQRCodeModal.close();
  };
  useEffect(() => {
    if (openModal) {
      WalletConnectQRCodeModal.open(uri);
    }
  }, [openModal]);
  return (
    <></>
    // <Modal
    //   hasCloseButton
    //   isOpen={openModal}
    //   onClose={handleCLoseWCModal}
    //   onEnter={openModal ? handleCLoseWCModal : undefined}
    //   className="WalletQrModal"
    //   title="Scan qrCode with your phone"
    // >
    //   {loadingQr && (
    //     <div className="spinner-holder">
    //       <Spinner color="blue" />
    //     </div>
    //   )}
    //   <div key="qr-container" className="qr-container pre-animate" ref={qrCodeRef} />
    //   <div className="connection-notes">
    //     {(windowWidth <= MOBILE_SCREEN_MAX_WIDTH) ? (
    //       <div className="no-pad-margin">
    //         <h4>{lang('Connect.Wallet.DeepLink')}</h4>
    //         <a className="wallet-deeplink" href={uri}>Open Wallet App</a>
    //       </div>
    //     ) : (
    //       <>
    //         <h4>{lang('Connect.Wallet.Title')}</h4>
    //         <ol>
    //           <li><span>{lang('Connect.Wallet.Help1')}</span></li>
    //           <li><span>{renderText(lang('Connect.Wallet.Help2'), ['simple_markdown'])}</span></li>
    //           <li><span>{lang('Connect.Wallet.Help3')}</span></li>
    //         </ol>
    //       </>
    //     )}
    //   </div>
    // </Modal>
  );
};

export default QrCodeDialog;
