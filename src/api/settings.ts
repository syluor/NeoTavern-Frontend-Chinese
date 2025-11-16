import type { LegacySettings } from '../types';
import { getRequestHeaders } from '../utils/api';

export async function fetchUserSettings(): Promise<LegacySettings> {
  const response = await fetch('/api/settings/get', {
    method: 'POST',
    headers: getRequestHeaders(),
    body: JSON.stringify({}),
    cache: 'no-cache',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user settings');
  }

  return JSON.parse((await response.json())['settings']);
}

export async function saveUserSettings(settings: LegacySettings): Promise<void> {
  await fetch('/api/settings/save', {
    method: 'POST',
    headers: getRequestHeaders(),
    body: JSON.stringify(settings),
    cache: 'no-cache',
  });
}
