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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } & Record<string, any>;
}

export interface Group {
  disabled_members?: Array<string>;
  chats: string[];
  members: Array<Character['name']>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
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
