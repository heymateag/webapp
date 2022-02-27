/* eslint-disable no-null/no-null */
import React, {
  FC,
} from 'teact/teact';
import useLang from '../../hooks/useLang';
import Modal from '../ui/Modal';
// import Button from '../ui/Button';
import './QrCodeDialog.scss';
import Spinner from '../ui/Spinner';
import renderText from './helpers/renderText';

type OwnProps = {
  isOpen: boolean;
  loadAcceptLoading: boolean;
  onCloseModal: () => void;
};

const AcceptTransactionDialog: FC<OwnProps> = ({
  isOpen = false,
  loadAcceptLoading = false,
  onCloseModal,
}) => {
  const lang = useLang();

  const handleCloseAcceptModal = () => {
    onCloseModal();
  };
  return (
    <Modal
      hasCloseButton
      isOpen={isOpen}
      onClose={onCloseModal}
      onEnter={isOpen ? handleCloseAcceptModal : undefined}
      className="WalletQrModal"
      title="accept transaction in your phone to continue"
    >
      {loadAcceptLoading && (
        <div className="spinner-holder aproval-loader">
          <Spinner color="blue" />
        </div>
      )}
      <div className="connection-notes">
        <h4>{lang('Connect.Approve.Title')}</h4>
        <ol>
          <li><span>{lang('Connect.Approve.Help1')}</span></li>
          <li><span>{renderText(lang('Connect.Approve.Help2'), ['simple_markdown'])}</span></li>
          <li><span>{lang('Connect.Approve.Help3')}</span></li>
        </ol>
      </div>
    </Modal>
  );
};

export default AcceptTransactionDialog;
