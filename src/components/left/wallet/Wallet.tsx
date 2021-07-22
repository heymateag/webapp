import { newKit } from '@celo/contractkit';
import {useContractKit} from "@celo-tools/use-contractkit";
import React, {
  FC, memo, useEffect, useState,
} from '../../../lib/teact/teact';
import useLang from '../../../hooks/useLang';
import './Wallet.scss';
import Button from '../../ui/Button';


// @ts-ignore
import walletIcon from '../../../assets/heymate/color-wallet.svg';


export type OwnProps = {
  onReset: () => void;
};


const Wallet: FC<OwnProps> = ({ onReset }) => {
  const { kit, address, send } = useContractKit();
  // eslint-disable-next-line global-require
  // const [acc, setAcc] = useState();
  // const kit = newKit('https://alfajores-forno.celo-testnet.org');
  // useEffect(() => {
  //   const accounts = async () => {
  //     const res = await kit.web3.eth.getAccounts();
  //
  //     console.log('============= EHSAN ============');
  //     console.log(res);
  //
  //     return res;
  //   };
  //   accounts();
  // }, [kit]);

  const lang = useLang();
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
        <h3 id="balance">$300.25</h3>
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
    </div>
  );
};

export default Wallet;
