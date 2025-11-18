export interface ChatMetadata {
  integrity?: string;
  custom_background?: string;
  chat_backgrounds?: string[];
  [key: string]: any;
}

export interface SwipeInfo {
  send_date?: string;
  gen_started?: string;
  gen_finished?: string;
  extra: {
    reasoning?: string;
    token_count?: number;
  } & Record<string, any>;
}

export interface ChatMessage {
  send_date?: string;
  name: string;
  mes: string;
  gen_started?: string;
  gen_finished?: string;
  is_user?: boolean;
  is_system?: boolean;
  force_avatar?: string;
  original_avatar?: string;
  swipes?: string[];
  swipe_info?: SwipeInfo[];
  swipe_id?: number;
  extra?: {
    reasoning?: string;
    reasoning_duration?: number;
    reasoning_type?: string;
    display_text?: string;
    reasoning_display_text?: string;
    token_count?: number;
  } & Record<string, any>;
}
