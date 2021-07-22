
import React, { FC, memo } from '../../../lib/teact/teact';
import { OwnProps } from './Wallet';
import { Bundles } from '../../../util/moduleLoader';
import useModuleLoader from '../../../hooks/useModuleLoader';
import Loading from '../../ui/Loading';

const WalletAsync: FC<OwnProps> = (props) => {
  const Wallet = useModuleLoader(Bundles.Extra, 'Wallet');
  // eslint-disable-next-line react/jsx-props-no-spreading
  return (Wallet ? <Wallet {...props} /> : <Loading />);
};

export default WalletAsync;
