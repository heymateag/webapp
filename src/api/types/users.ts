import { ApiPhoto } from './messages';
import { ApiBotCommand } from './bots';

export interface ApiUser {
  id: string;
  isMin: boolean;
  isSelf?: true;
  isVerified?: true;
  isContact?: true;
  type: ApiUserType;
  firstName?: string;
  lastName?: string;
  status?: ApiUserStatus;
  username: string;
  phoneNumber: string;
  accessHash?: string;
  avatarHash?: string;
  photos?: ApiPhoto[];
  botPlaceholder?: string;
  canBeInvitedToGroup?: boolean;
  commonChats?: {
    ids: string[];
    maxId: string;
    isFullyLoaded: boolean;
  };

  // Obtained from GetFullUser / UserFullInfo
  fullInfo?: ApiUserFullInfo;
}

export interface ApiUserFullInfo {
  isBlocked?: boolean;
  bio?: string;
  commonChatsCount?: number;
  botDescription?: string;
  pinnedMessageId?: number;
  botCommands?: ApiBotCommand[];
}

export type ApiUserType = 'userTypeBot' | 'userTypeRegular' | 'userTypeDeleted' | 'userTypeUnknown';

export interface ApiUserStatus {
  type: (
    'userStatusEmpty' | 'userStatusLastMonth' | 'userStatusLastWeek' |
    'userStatusOffline' | 'userStatusOnline' | 'userStatusRecently'
  );
  wasOnline?: number;
  expires?: number;
}

export interface IHeymateUser {
  deviceId: string;

  pushId: string;

  phoneNumber: string;
  fullName: string;
  userName: string;
  avatarHash: string;
  telegramId: string;
  walletAddress: string;

  paymentMethod: 'WALLECTCONNECT' | 'PUSH' | 'NOTSET';
  devices: {
    deviceUUID: string;
    deviceName: string;
    deviceType: string;
    pushToken: string;
    walletAddress: string;
    currency: string;
    balance?: {
      cUSD: string;
    }
  }[];

  transactionDefaultDevice: {
    deviceUUID: string;
    deviceName: string;
    deviceType: string;
    pushToken: string;
    walletAddress: string;
    currency: string;
    balance?: {
      cUSD: string;
    }
  };
};
