import { useEffect } from 'teact/teact';
import WalletConnectQRCodeModal from '@walletconnect/qrcode-modal';

export function useWalletConnectQrModal(uri: string, openModal: boolean, cb: any) {
  useEffect(() => {
    if (openModal) {
      WalletConnectQRCodeModal.open(uri, cb);
    } else {
      WalletConnectQRCodeModal.close();
    }
  }, [cb, openModal, uri]);
}
