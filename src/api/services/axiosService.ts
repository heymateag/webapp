import axios from 'axios';
import { HEYMATE_URL } from '../../config';
import { IHttpResponse } from '../../types/HeymateTypes/HttpResponse.model';

axios.interceptors.request.use(
  (config) => {
    // @ts-ignore
    config.headers['Content-Type'] = 'application/json';
    // @ts-ignore
    if (!config.url.includes('/login')) {
      // @ts-ignore
      config.headers.Authorization = `Bearer ${localStorage.getItem('HM_TOKEN')}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Add a response interceptor
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalConfig = error.config;
    if (
      error.response.status === 500
      && error.response.data.message === 'invalid token'
    ) {
      // ========= Don't redirect to login if we are in landing
      throw error;
    }
    if (
      error.response.status === 500
      && error.response.data.message === 'jwt expired'
    ) {
      // ========= Don't redirect to login if we are in landing
      throw error;
    }

    if (originalConfig.url !== '/auth/login' && error.response) {
      // Access Token was expired
      // eslint-disable-next-line no-underscore-dangle
      if (error.response.status === 401 && !originalConfig._retry) {
        // eslint-disable-next-line no-underscore-dangle
        originalConfig._retry = true;

        try {
          const rs = await axios.post(`${HEYMATE_URL}/auth/refresh`, {
            refToken: localStorage.getItem('HM_REFRESH_TOKEN'),
            user: localStorage.getItem('HM_PHONE'),
          });

          const { token } = rs.data;
          localStorage.setItem('HM_TOKEN', token);

          return await axios(originalConfig);
        } catch (_error) {
          return Promise.reject(_error);
        }
      }
    }

    return Promise.reject(error);
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    // throw error;
  },
);
type Method =
  | 'get' | 'GET'
  | 'delete' | 'DELETE'
  | 'head' | 'HEAD'
  | 'options' | 'OPTIONS'
  | 'post' | 'POST'
  | 'put' | 'PUT'
  | 'patch' | 'PATCH'
  | 'purge' | 'PURGE'
  | 'link' | 'LINK'
  | 'unlink' | 'UNLINK';
interface IAxiosParam {
  url: string;
  method: Method;
  body: any;
}
export const axiosService = async (request: IAxiosParam): Promise<IHttpResponse> => {
  try {
    const response = await axios({
      method: request.method,
      url: request.url,
      data: request.body,
    })
      .then((res) => {
        return res;
      })
      .catch((err) => {
        return err.response;
      });
    return response;
  } catch (error: any) {
    return error;
  }
};
