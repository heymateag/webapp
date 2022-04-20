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
type DispatchProps = Pick<GlobalActions, 'disconnect'>;

const App: FC<StateProps & DispatchProps> = ({ authState, disconnect }) => {
  const [isInactive, markInactive] = useFlag(false);
  const [isTokenFound, setTokenFound] = useState(false);

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

onMessageListener().then(payload => {
  // setNotification({title: payload.notification.title, body: payload.notification.body})
  // setShow(true);
  // console.log(payload);
  debugger
}).catch((err) => console.log('failed: ', err));

const onShowNotificationClicked = () => {
  // setNotification({title: "Notification", body: "This is a test notification"})
  // setShow(true);
  debugger
}


function renderMain() {
  return (
    <UiLoader page="main" key="main">
      <Main />
    </UiLoader>
  );
}

export default withGlobal(
  (global): StateProps => pick(global, ['authState']),
  (setGlobal, actions): DispatchProps => pick(actions, ['disconnect']),
)(App);
