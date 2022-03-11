import { useEffect } from 'teact/teact';
import WalletConnectQRCodeModal from '@walletconnect/qrcode-modal';

export function useWalletConnectQrModal(uri: string, openModal: boolean, cb: any) {
  useEffect(() => {
    if (openModal) {
      const isOpen = document.getElementById('walletconnect-qrcode-modal') || undefined;
      if (typeof isOpen === 'undefined') {
        WalletConnectQRCodeModal.open(uri, cb);
      }
    }
  }, [cb, openModal, uri]);
}
