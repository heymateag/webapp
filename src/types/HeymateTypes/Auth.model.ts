import { IHttpResponse } from './HttpResponse.model';

interface IHmAuth {
  accessToken: {
    jwtToken: string;
    payload: {
      'origin_jti': string;
      'sub': string;
      'event_id': string;
      'token_use': string;
      'scope': string;
      'auth_time': number;
      'iss': string;
      'exp': number;
      'iat': number;
      'jti': string;
      'client_id': string;
      'username': string;
    };
  };
  idToken: {
    jwtToken: string;
    payload: {
      'origin_jti': string;
      'sub': string;
      'event_id': string;
      'token_use': string;
      'scope': string;
      'auth_time': number;
      'iss': string;
      'exp': number;
      'iat': number;
      'jti': string;
      'client_id': string;
      'username': string;
    };
  };
  refreshToken: {
    token: string;
    payload: {
      'origin_jti': string;
      'sub': string;
      'event_id': string;
      'token_use': string;
      'scope': string;
      'auth_time': number;
      'iss': string;
      'exp': number;
      'iat': number;
      'jti': string;
      'client_id': string;
      'username': string;
    };
  };
}
export interface IAuth extends IHttpResponse {
  data: IHmAuth;
}
