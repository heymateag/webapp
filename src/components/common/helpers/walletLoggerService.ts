
import detectBrowserName from './detectBrowserName';
import { axiosService } from '../../../api/services/axiosService';
import { HEYMATE_URL } from '../../../config';

const walletLoggerService = async (data: any) => {
  const browser = detectBrowserName();
  const response  = await axiosService({
    url: `${HEYMATE_URL}/wallet-logger`,
    method: 'POST',
    body: {
      ...data,
      platform: 'WEB',
      browser,
    },
  });
};

export default walletLoggerService;
