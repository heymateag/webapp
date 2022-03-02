import { useEffect } from 'teact/teact';
import WalletConnectQRCodeModal from '@walletconnect/qrcode-modal';

export function useWalletConnectQrModal(uri: string, openModal: boolean) {
  useEffect(() => {
    debugger
    if (openModal) {
      WalletConnectQRCodeModal.open(uri, undefined);
    } else {
      WalletConnectQRCodeModal.close();
    }
  }, [openModal, uri]);
}
