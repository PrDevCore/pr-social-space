import { PlatformConfig, PlatformId } from './socialspace-types';

export const PLATFORMS: Record<PlatformId, PlatformConfig> = {
  twitter: {
    id: 'twitter',
    name: 'X (Twitter)',
    iconName: 'Twitter',
    color: '#000000',
    bgColor: 'bg-slate-900',
    borderColor: 'border-slate-700',
    maxChars: 280,
    handleExample: '@brand_official'
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    iconName: 'Linkedin',
    color: '#0A66C2',
    bgColor: 'bg-blue-900/20 text-blue-400',
    borderColor: 'border-blue-500/30',
    maxChars: 3000,
    handleExample: 'company/brand-inc'
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    iconName: 'Facebook',
    color: '#1877F2',
    bgColor: 'bg-blue-800/20 text-blue-300',
    borderColor: 'border-blue-600/30',
    maxChars: 63206,
    handleExample: 'BrandPageOfficial'
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    iconName: 'Instagram',
    color: '#E4405F',
    bgColor: 'bg-pink-950/30 text-pink-400',
    borderColor: 'border-pink-500/30',
    maxChars: 2200,
    handleExample: '@brand.app'
  },
  pinterest: {
    id: 'pinterest',
    name: 'Pinterest',
    iconName: 'Pin',
    color: '#BD081C',
    bgColor: 'bg-red-950/30 text-red-400',
    borderColor: 'border-red-500/30',
    maxChars: 500,
    handleExample: 'brand_pins'
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    iconName: 'Video',
    color: '#00F2FE',
    bgColor: 'bg-cyan-950/30 text-cyan-400',
    borderColor: 'border-cyan-500/30',
    maxChars: 2200,
    handleExample: '@brand_tok'
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube Community',
    iconName: 'Youtube',
    color: '#FF0000',
    bgColor: 'bg-red-900/20 text-red-500',
    borderColor: 'border-red-600/30',
    maxChars: 5000,
    handleExample: 'c/BrandChannel'
  },
  threads: {
    id: 'threads',
    name: 'Threads',
    iconName: 'AtSign',
    color: '#000000',
    bgColor: 'bg-neutral-800/40 text-neutral-200',
    borderColor: 'border-neutral-600/40',
    maxChars: 500,
    handleExample: '@brand_threads'
  },
  bluesky: {
    id: 'bluesky',
    name: 'Bluesky',
    iconName: 'Cloud',
    color: '#0085FF',
    bgColor: 'bg-sky-950/30 text-sky-400',
    borderColor: 'border-sky-500/30',
    maxChars: 300,
    handleExample: 'brand.bsky.social'
  },
  mastodon: {
    id: 'mastodon',
    name: 'Mastodon',
    iconName: 'Share2',
    color: '#6364FF',
    bgColor: 'bg-indigo-950/30 text-indigo-400',
    borderColor: 'border-indigo-500/30',
    maxChars: 500,
    handleExample: '@brand@mastodon.social'
  }
};
