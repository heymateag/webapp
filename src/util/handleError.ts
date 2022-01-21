import { DEBUG_ALERT_MSG } from '../config';
import { throttle } from './schedulers';

window.addEventListener('error', handleErrorEvent);
window.addEventListener('unhandledrejection', handleErrorEvent);

// eslint-disable-next-line prefer-destructuring
const APP_ENV = process.env.APP_ENV;

function handleErrorEvent(e: ErrorEvent | PromiseRejectionEvent) {
  e.preventDefault();

  handleError(e instanceof ErrorEvent ? e.error : e.reason);
}

const throttledAlert = throttle(window.alert, 1000);

export function handleError(err: Error) {
  if (APP_ENV === 'development') {
    throttledAlert(`${DEBUG_ALERT_MSG}\n\n${(err?.message) || err}\n${err?.stack}`);
  }
}
