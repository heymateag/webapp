import ZoomVideo from '@zoom/videosdk';
import { JoinSession } from './types';

const KJUR = require('jsrsasign');

/**
 * Generate Zoom Video Session
 * @param sessionName
 * @param sessionPasscode
 */
export class ZoomClient {
  constructor() {
    this.client = ZoomVideo.createClient();
    // this.client.init('en-US', '/public/zoom-libs');
    this.client.init('en-US', 'Global');
  }

  public client;

  public signature;

  private sessionName;

  private sessionPass;

  generateZoomSignature = (sessionName: string, sessionPasscode: string) => {
    this.sessionName = sessionName;
    this.sessionPass = sessionPasscode;
    const iat = Math.round(new Date().getTime() / 1000);
    const exp = iat + 60 * 60 * 2;

    const oHeader = { alg: 'HS256', typ: 'JWT' };

    const oPayload = {
      app_key: 'oeg5Fynw3nkRIT06qoMNv66RtTSzROUQMmaj',
      iat,
      exp,
      tpc: sessionName,
      pwd: sessionPasscode,
    };

    const sHeader = JSON.stringify(oHeader);
    const sPayload = JSON.stringify(oPayload);
    this.signature = KJUR.jws.JWS.sign('HS256', sHeader, sPayload, 'UYC0eqAhuPrHE5f1TCXOp1ozWpKvZySOwsxn');

    return this.signature;
  };

  joinTOSession = async (meetData: JoinSession) => {
    this.client.join(this.sessionName, meetData.signature, meetData.userName, this.sessionPass)
      .then((data) => {
        console.log(data);
        return this.client.getMediaStream();
      }).catch((error) => {
        throw error;
      });
  };
}
