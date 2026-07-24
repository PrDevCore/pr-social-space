import { Post, ApiLog } from './socialspace-types';

export const postsStore: Post[] = [];
export const apiLogsStore: ApiLog[] = [];

export function addApiLog(log: ApiLog) {
  apiLogsStore.unshift(log);
}

export function addPost(post: Post) {
  postsStore.unshift(post);
}
