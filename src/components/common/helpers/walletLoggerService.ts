import axios from 'axios';
import detectBrowserName from './detectBrowserName';
import { axiosService } from '../../../api/services/axiosService';
import { HEYMATE_URL } from '../../../config';

const getData = async () => {
  const res = await axios.get('https://geolocation-db.com/json/');
  return (res.data.IPv4);
};

const walletLoggerService = async (data: any) => {
  const browser = detectBrowserName();
  // const ip = await getData();
  const response  = await axiosService({
    url: `${HEYMATE_URL}/wallet-logger`,
    method: 'POST',
    body: {
      ...data,
      platform: 'WEB',
      browser,
      // userIp: ip,
    },
  });
};

export default walletLoggerService;
