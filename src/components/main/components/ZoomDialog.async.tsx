import React, { FC, memo } from 'teact/teact';
import { Bundles } from '../../../util/moduleLoader';

import useModuleLoader from '../../../hooks/useModuleLoader';

const ZoomDialogAsync: FC = ({ isOpen }) => {
  const ZoomDialog = useModuleLoader(Bundles.Extra, 'ZoomDialog', !isOpen);

  // eslint-disable-next-line react/jsx-props-no-spreading
  return ZoomDialog ? <ZoomDialog /> : undefined;
};

export default memo(ZoomDialogAsync);
