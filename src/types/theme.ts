export interface ThemeVariables {
  // Colors
  '--theme-text-color': string;
  '--theme-emphasis-color': string;
  '--theme-underline-color': string;
  '--theme-quote-color': string;
  '--theme-background-tint': string;
  '--theme-chat-tint': string;
  '--theme-user-message-tint': string;
  '--theme-bot-message-tint': string;
  '--theme-shadow-color': string;
  '--theme-border-color': string;

  // Accents
  '--color-accent-red': string;
  '--color-accent-green': string;
  '--color-warning': string;
  '--color-error-crimson': string;

  // Scrollbar
  '--scrollbar-width': string;
  '--scrollbar-thumb-color': string;
  '--scrollbar-track-color': string;
  '--scrollbar-thumb-radius': string;
  '--scrollbar-track-radius': string;
  '--scrollbar-thumb-border-width': string;
  '--scrollbar-thumb-shadow-color': string;

  // Typography & Sizing
  '--font-size-main': string;
  '--font-family-main': string;
  '--font-family-mono': string;
  '--base-border-radius': string;
  '--blur-strength': string;
  '--shadow-width': string;

  // Layout
  '--panel-width': string;
  '--sidebar-width': string;

  // Avatars
  '--avatar-width': string;
  '--avatar-height': string;
  '--avatar-border-radius': string;
}

export interface Theme {
  isSystem?: boolean;
  variables: Partial<ThemeVariables>;
}

export const THEME_CATEGORIES: Record<string, (keyof ThemeVariables)[]> = {
  Colors: [
    '--theme-text-color',
    '--theme-emphasis-color',
    '--theme-background-tint',
    '--theme-chat-tint',
    '--theme-user-message-tint',
    '--theme-bot-message-tint',
    '--theme-shadow-color',
    '--theme-border-color',
  ],
  Accents: [
    '--theme-quote-color',
    '--theme-underline-color',
    '--color-accent-red',
    '--color-accent-green',
    '--color-warning',
    '--color-error-crimson',
  ],
  Typography: ['--font-family-main', '--font-family-mono', '--font-size-main'],
  Scrollbar: [
    '--scrollbar-width',
    '--scrollbar-thumb-color',
    '--scrollbar-track-color',
    '--scrollbar-thumb-shadow-color',
    '--scrollbar-thumb-radius',
    '--scrollbar-track-radius',
    '--scrollbar-thumb-border-width',
  ],
  UI: ['--base-border-radius', '--blur-strength', '--shadow-width', '--panel-width', '--sidebar-width'],
  Avatars: ['--avatar-width', '--avatar-height', '--avatar-border-radius'],
};

export const VARIABLE_LABELS: Record<keyof ThemeVariables, string> = {
  '--theme-text-color': 'Text Color',
  '--theme-emphasis-color': 'Emphasis Color',
  '--theme-underline-color': 'Underline Color',
  '--theme-quote-color': 'Quote Color',
  '--theme-background-tint': 'Background Tint',
  '--theme-chat-tint': 'Chat Container Tint',
  '--theme-user-message-tint': 'User Message Bubble',
  '--theme-bot-message-tint': 'Bot Message Bubble',
  '--theme-shadow-color': 'Shadow Color',
  '--theme-border-color': 'Border Color',
  '--color-accent-red': 'Accent Red',
  '--color-accent-green': 'Accent Green',
  '--color-warning': 'Warning Color',
  '--color-error-crimson': 'Error Color',

  '--scrollbar-width': 'Width',
  '--scrollbar-thumb-color': 'Thumb Color',
  '--scrollbar-track-color': 'Track Color',
  '--scrollbar-thumb-radius': 'Thumb Radius',
  '--scrollbar-track-radius': 'Track Radius',
  '--scrollbar-thumb-border-width': 'Thumb Border Spacing',
  '--scrollbar-thumb-shadow-color': 'Thumb Inner Shadow',

  '--font-size-main': 'Base Font Size',
  '--font-family-main': 'Main Font Family',
  '--font-family-mono': 'Monospace Font Family',
  '--base-border-radius': 'Global Border Radius',
  '--blur-strength': 'Blur Strength (px)',
  '--shadow-width': 'Shadow Size (px)',

  '--panel-width': 'Main Panel Width',
  '--sidebar-width': 'Sidebar Width',

  '--avatar-width': 'Avatar Width',
  '--avatar-height': 'Avatar Height',
  '--avatar-border-radius': 'Avatar Radius',
};

export const VARIABLE_TYPES: Record<keyof ThemeVariables, 'color' | 'text' | 'number'> = {
  '--theme-text-color': 'color',
  '--theme-emphasis-color': 'color',
  '--theme-underline-color': 'color',
  '--theme-quote-color': 'color',
  '--theme-background-tint': 'color',
  '--theme-chat-tint': 'color',
  '--theme-user-message-tint': 'color',
  '--theme-bot-message-tint': 'color',
  '--theme-shadow-color': 'color',
  '--theme-border-color': 'color',
  '--color-accent-red': 'color',
  '--color-accent-green': 'color',
  '--color-warning': 'color',
  '--color-error-crimson': 'color',

  '--scrollbar-width': 'text',
  '--scrollbar-thumb-color': 'color',
  '--scrollbar-track-color': 'color',
  '--scrollbar-thumb-radius': 'text',
  '--scrollbar-track-radius': 'text',
  '--scrollbar-thumb-border-width': 'text',
  '--scrollbar-thumb-shadow-color': 'color',

  '--font-size-main': 'text',
  '--font-family-main': 'text',
  '--font-family-mono': 'text',
  '--base-border-radius': 'text',
  '--blur-strength': 'number',
  '--shadow-width': 'number',

  '--panel-width': 'text',
  '--sidebar-width': 'text',

  '--avatar-width': 'text',
  '--avatar-height': 'text',
  '--avatar-border-radius': 'text',
};
