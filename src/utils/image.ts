import { default_avatar } from '../constants';
import type { ThumbnailType } from '../types';

export function getThumbnailUrl(type: ThumbnailType, file: string | undefined): string {
  if (!file || file === 'none') {
    return default_avatar;
  }
  return `/thumbnail?type=${type}&file=${encodeURIComponent(file)}`;
}
