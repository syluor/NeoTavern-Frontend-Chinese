import type { MessageRole } from './common';

export interface PersonaConnection {
  type: 'character' | 'group';
  id: string; // character avatar or group id
}

export interface PersonaDescription {
  description: string;
  position: number;
  depth: number;
  role: MessageRole;
  lorebook: string;
  connections: PersonaConnection[];
  title: string;
}

export interface Persona extends PersonaDescription {
  avatarId: string;
  name: string;
}
