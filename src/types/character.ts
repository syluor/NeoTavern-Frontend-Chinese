import type { MessageRole } from './common';

export interface Character {
  fav?: boolean | string;
  create_date?: string;
  talkativeness?: number;
  name: string;
  avatar: string; // unique avatar filename
  description?: string;
  first_mes?: string;
  scenario?: string;
  personality?: string;
  mes_example?: string;
  tags?: string[];
  creatorcomment?: string;
  json_data?: string;
  chat?: string;
  shallow?: boolean;
  data?: {
    alternate_greetings?: string[];
    creator_notes?: string;
    creator?: string;
    character_version?: string;
    system_prompt?: string;
    post_history_instructions?: string;
    depth_prompt?: {
      prompt: string;
      depth: number;
      role: MessageRole;
    };
  } & Record<string, any>;
}

export interface Group {
  disabled_members?: Array<string>;
  chats: string[];
  members: Array<Character['name']>;
  past_metadata?: Record<string, any>;
  id: string;
  chat_id: string;
}

export interface Tag {
  id: string;
  name: string;
  folder_type?: string;
  filter_state?: string;
  sort_order?: number;
  color?: string;
  color2?: string;
  create_date?: number;
  is_hidden_on_character_card?: boolean;
  action?: Function;
  class?: string;
  icon?: string;
  title?: string;
}

export interface Entity {
  item: Character | Tag | Group;
  id: string | number;
  type: 'character' | 'tag' | 'group';
  entities?: Entity[];
  hidden?: number;
  isUseless?: boolean;
}

export interface CreateSave {
  name: string;
  description: string;
  creator_notes: string;
  post_history_instructions: string;
  character_version: string;
  system_prompt: string;
  tags: string;
  creator: string;
  personality: string;
  first_message: string;
  avatar: FileList | null;
  scenario: string;
  mes_example: string;
  world: string;
  talkativeness: number;
  alternate_greetings: any[];
  depth_prompt_prompt: string;
  depth_prompt_depth: number;
  depth_prompt_role: string;
  extensions: Record<string, any>;
  extra_books: any[];
}
