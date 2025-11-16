import { getRequestHeaders } from '../utils/api';
import type { Character } from '../types';

export async function fetchChat(character: Character, chatFile: string): Promise<any[]> {
  const response = await fetch('/api/chats/get', {
    method: 'POST',
    headers: getRequestHeaders(),
    body: JSON.stringify({
      ch_name: character.name,
      file_name: chatFile,
      avatar_url: character.avatar,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch chat history');
  }

  return await response.json();
}

export async function saveChat(character: Character, chatFile: string, chatToSave: any[]): Promise<void> {
  const response = await fetch('/api/chats/save', {
    method: 'POST',
    headers: getRequestHeaders(),
    body: JSON.stringify({
      ch_name: character.name,
      file_name: chatFile,
      chat: chatToSave,
      avatar_url: character.avatar,
      force: false, // For now, we won't handle the integrity check failure popup
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    // TODO: Handle integrity check failure with a user prompt
    if (errorData?.error === 'integrity') {
      throw new Error('Chat integrity check failed. Data may be out of sync.');
    }
    throw new Error('Failed to save chat history');
  }
}

// TODO: Implement this on the backend
export async function listChatsForCharacter(character: Character): Promise<string[]> {
  console.log(`[TODO] Fetching chat list for ${character.name}`);
  // This is a mocked response. A real implementation would make an API call.
  // The backend would list files in the `chats/{character.avatar}/` directory.
  return Promise.resolve(character.chat ? [character.chat] : []); // For now, return the default chat
}

// TODO: Implement this on the backend
export async function deleteChat(character: Character, chatFile: string): Promise<void> {
  console.log(`[TODO] Deleting chat file ${chatFile} for ${character.name}`);
  // This would make a call like POST /api/chats/delete
  Promise.resolve();
}

// TODO: Implement this on the backend
export async function renameChat(character: Character, oldFile: string, newFile: string): Promise<void> {
  console.log(`[TODO] Renaming chat file ${oldFile} to ${newFile} for ${character.name}`);
  // This would make a call like POST /api/chats/rename
  Promise.resolve();
}
