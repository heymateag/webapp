import { FC, useEffect, useState } from 'teact/teact';
import React, { withGlobal } from './lib/teact/teactn';
import { GlobalActions, GlobalState } from './global/types';

import { INACTIVE_MARKER, PAGE_TITLE } from './config';
import { pick } from './util/iteratees';
import { updateSizes } from './util/windowSize';
import { addActiveTabChangeListener } from './util/activeTabMonitor';
import useFlag from './hooks/useFlag';

import Auth from './components/auth/Auth';
import UiLoader from './components/common/UiLoader';
import Main from './components/main/Main.async';
import AppInactive from './components/main/AppInactive';
import { hasStoredSession } from './util/sessions';
// import Test from './components/test/TestNoRedundancy';
import { fetchToken, onMessageListener } from './firebase';

type StateProps = Pick<GlobalState, 'authState'>;
type DispatchProps = Pick<GlobalActions, 'disconnect' | 'showNotification'>;

const App: FC<StateProps & DispatchProps> = ({ authState, disconnect, showNotification}) => {
  const [isInactive, markInactive] = useFlag(false);
  const [isTokenFound, setTokenFound] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  useEffect(() => {
    updateSizes();
    addActiveTabChangeListener(() => {
      disconnect();
      document.title = `${PAGE_TITLE}${INACTIVE_MARKER}`;
      markInactive();
    });
  }, [disconnect, markInactive]);

  useEffect(() => {
    fetchToken(setTokenFound);
  }, []);
  onMessageListener().then((payload) => {
    setShowNotif(true);
    showNotification({ message: payload.data.title });
    setShowNotif(false);
  }).catch((err) => console.log('failed: ', err));

  // return <Test />;

  if (isInactive) {
    return <AppInactive />;
  }

  if (authState) {
    switch (authState) {
      case 'authorizationStateWaitPhoneNumber':
      case 'authorizationStateWaitCode':
      case 'authorizationStateWaitPassword':
      case 'authorizationStateWaitRegistration':
      case 'authorizationStateWaitQrCode':
        return <Auth />;
      case 'authorizationStateClosed':
      case 'authorizationStateClosing':
      case 'authorizationStateLoggingOut':
      case 'authorizationStateReady':
        return renderMain();
    }
  }

  return hasStoredSession(true) ? renderMain() : <Auth />;
};

function renderMain() {
  return (
    <UiLoader page="main" key="main">
      <Main />
    </UiLoader>
  );
}

export default withGlobal(
  (global): StateProps => pick(global, ['authState']),
  (setGlobal, actions): DispatchProps => pick(actions, ['disconnect', 'showNotification']),
)(App);
