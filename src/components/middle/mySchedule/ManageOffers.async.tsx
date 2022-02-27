import React, { FC, memo } from '../../../lib/teact/teact';
import { OwnProps } from './MySchedule';
import { Bundles } from '../../../util/moduleLoader';

import useModuleLoader from '../../../hooks/useModuleLoader';
import Loading from '../../ui/Loading';

const ManageOffersAsync: FC<OwnProps> = (props) => {
  const ManageOffers = useModuleLoader(Bundles.Extra, 'ManageOffers');
  // eslint-disable-next-line react/jsx-props-no-spreading
  return (ManageOffers ? <ManageOffers {...props} /> : <Loading />);
};

export default memo(ManageOffersAsync);
