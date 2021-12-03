import ZoomVideo from '@zoom/videosdk';
// @ts-ignore
import state from './js/meeting/session/simple-state';
// @ts-ignore
import { generateSessionToken } from './js/tool';

/**
 * Generate Zoom Video Session
 * @param sessionName
 * @param sessionPasscode
 */
export class ZoomClient {
  constructor(sessionTopic: string, sessionPasscode: string, userName: string) {
    this.zmClient = ZoomVideo.createClient();
    // const audioTrack = ZoomVideo.createLocalAudioTrack();
    // const videoTrack = ZoomVideo.createLocalVideoTrack();

    this.zmClient.init('en-US', 'Global');
    this.userName = userName;
    this.sessionName = sessionTopic;
    this.sessionPass = sessionPasscode;
    this.signature = generateSessionToken(sessionTopic, sessionPasscode);
  }

  public zmClient;

  public signature;

  private sessionName;

  private sessionPass;

  private readonly userName: string;

  public mediaStream;

  initAndJoinSession = async () => {
    try {
      await this.zmClient
        .join(this.sessionName, this.signature, this.userName, this.sessionPass);
      this.mediaStream = this.zmClient.getMediaStream();
      state.selfId = this.zmClient.getSessionInfo().userId;
    } catch (error) {
      console.log(error);
    }
  };

  startAudioMuted = async () => {
    await this.mediaStream.startAudio();
    if (!this.mediaStream.isAudioMuted()) {
      await this.mediaStream.muteAudio();
    }
  };

  join = async () => {
    console.log('======= Initializing video session =======');
    await this.initAndJoinSession();
    /**
     * Note: it is STRONGLY recommended to initialize the client listeners as soon as
     * the session is initialized. Once the user joins the session, updates are sent to
     * the event listeners that help update the session's participant state.
     *
     * If you choose not to do so, you'll have to manually deal with race conditions.
     * You should be able to call "zmClient.getAllUser()" after the app has reached
     * steady state, meaning a sufficiently-long time
     */
    // console.log('======= Initializing client event handlers =======');
    // initClientEventListeners(zmClient, mediaStream);
    // console.log('======= Starting audio muted =======');
    // await this.startAudioMuted();
    // console.log('======= Initializing button click handlers =======');
    // // await initButtonClickHandlers(zmClient, mediaStream);
    // console.log('======= Session joined =======');
  };
}
