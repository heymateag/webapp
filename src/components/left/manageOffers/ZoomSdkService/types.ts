import {
  VideoClient,
  Stream,
  Participant,
  ChatClient as SDKChatClient,
} from '@zoom/videosdk';

export type ClientType = typeof VideoClient;
export type MediaStream = typeof Stream;
export type MeetingParticipants = Participant;
export type ChatClient = typeof SDKChatClient;
