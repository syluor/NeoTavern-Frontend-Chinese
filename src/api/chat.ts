import { getRequestHeaders } from '../utils/api';
import type { Character, ChatInfo, FullChat } from '../types';

export async function fetchChat(character: Character, chatFile: string): Promise<FullChat> {
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

export async function saveChat(character: Character, chatFile: string, chatToSave?: FullChat): Promise<void> {
  const response = await fetch('/api/chats/save', {
    method: 'POST',
    headers: getRequestHeaders(),
    body: JSON.stringify({
      ch_name: character.name,
      file_name: chatFile,
      chat: chatToSave || [],
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

export async function listChatsForCharacter(character: Character): Promise<ChatInfo[]> {
  const response = await fetch('/api/characters/chats', {
    method: 'POST',
    headers: getRequestHeaders(),
    body: JSON.stringify({
      avatar_url: character.avatar,
      metadata: true,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to list chat histories');
  }

  return await response.json();
}

export async function deleteChat(character: Character, chatFile: string): Promise<void> {
  const response = await fetch('/api/chats/delete', {
    method: 'POST',
    headers: getRequestHeaders(),
    body: JSON.stringify({
      chatfile: chatFile,
      avatar_url: character.avatar,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to delete chat history');
  }
}
export async function renameChat(
  character: Character,
  oldFile: string,
  newFile: string,
  isGroup: boolean,
): Promise<{ newFileName: string }> {
  const response = await fetch('/api/chats/rename', {
    method: 'POST',
    headers: getRequestHeaders(),
    body: JSON.stringify({
      avatar_url: character.avatar,
      original_file: oldFile,
      renamed_file: newFile,
      is_group: isGroup,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to rename chat history');
  }

  const data = await response.json();

  if (data.error) {
    throw new Error('Server returned an error.');
  }

  return { newFileName: data.sanitizedFileName || newFile };
}
