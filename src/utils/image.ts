import { default_avatar } from '../constants';
import type { ThumbnailType } from '../types';
import { usePersonaStore } from '../stores/persona.store';

export function getThumbnailUrl(type: ThumbnailType, file: string | undefined): string {
  if (!file || file === 'none') {
    return default_avatar;
  }
  const personaStore = usePersonaStore();
  const timestamp = personaStore.lastAvatarUpdate;
  return `/thumbnail?type=${type}&file=${encodeURIComponent(file)}&t=${timestamp}`;
}

interface AvatarDetails {
  type: ThumbnailType;
  file?: string;
  isUser: boolean;
  forceAvatar?: string;
  activePlayerAvatar?: string | null;
}

/**
 * Resolves thumbnail and full-size URLs for an avatar based on various conditions.
 * @param details - The details of the avatar to resolve.
 * @returns An object with `thumbnail` and `full` URL strings.
 */
export function resolveAvatarUrls(details: AvatarDetails): { thumbnail: string; full: string } {
  // Case 1: A specific avatar is forced (e.g., for user messages).
  if (details.forceAvatar) {
    return { thumbnail: details.forceAvatar, full: details.forceAvatar };
  }

  // Case 2: It's a user message without a forced avatar.
  if (details.isUser) {
    const userAvatarFile = details.activePlayerAvatar ?? undefined;
    const thumbnail = getThumbnailUrl('persona', userAvatarFile);
    const full = userAvatarFile ? `/personas/${userAvatarFile}` : default_avatar;
    return { thumbnail, full };
  }

  // Case 3: It's a bot message.
  const characterAvatarFile = details.file;
  const thumbnail = getThumbnailUrl(details.type, characterAvatarFile);
  const full = characterAvatarFile ? `/characters/${characterAvatarFile}` : default_avatar;
  return { thumbnail, full };
}
