export type PlatformId =
  | 'twitter'
  | 'linkedin'
  | 'facebook'
  | 'instagram'
  | 'pinterest'
  | 'tiktok'
  | 'youtube'
  | 'threads'
  | 'bluesky'
  | 'mastodon';

export interface PlatformConfig {
  id: PlatformId;
  name: string;
  iconName: string;
  color: string;
  bgColor: string;
  borderColor: string;
  maxChars: number;
  handleExample: string;
}

export interface Post {
  id: string;
  caption: string;
  platforms: PlatformId[];
  mediaUrls: string[];
  status: 'published' | 'scheduled' | 'failed' | 'draft';
  scheduledAt?: string;
  createdAt: string;
  apiResponse?: any;
  requestPayload?: any;
  error?: string;
}

export interface SocialAccount {
  platform: PlatformId;
  handle: string;
  status: 'connected' | 'disconnected' | 'needs_reauth';
  followerCount: number;
  lastSyncedAt?: string;
}

export interface ApiLog {
  id: string;
  timestamp: string;
  endpoint: string;
  method: string;
  statusCode: number;
  durationMs: number;
  requestBody: any;
  responseBody: any;
  isSimulated: boolean;
}

export interface ApiVerificationResult {
  valid: boolean;
  organization?: string;
  environment?: 'live' | 'sandbox';
  message: string;
}
