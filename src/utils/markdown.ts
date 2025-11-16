import Showdown from 'showdown';
import DOMPurify from 'dompurify';
import type { ChatMessage } from '../types';
import { useSettingsStore } from '../stores/settings.store';

const converter = new Showdown.Converter({
  // See https://github.com/showdownjs/showdown/wiki/Showdown-Options
  ghCompatibleHeaderId: true,
  parseImgDimensions: true,
  strikethrough: true,
  tables: true,
  tasklists: true,
  smartIndentationFix: true,
  simpleLineBreaks: true, // This is important for chat
  openLinksInNewWindow: true,
});

function isOdd(num: number): boolean {
  return num % 2 !== 0;
}
function countOccurrences(str: string, char: string): number {
  return str.split(char).length - 1;
}

export function fixMarkdown(text: string): string {
  // Find pairs of formatting characters and capture the text in between them
  const format = /([*_]{1,2})([\s\S]*?)\1/gm;
  const matches: RegExpExecArray[] = [];
  let match;
  while ((match = format.exec(text)) !== null) {
    matches.push(match);
  }

  // Iterate through the matches and replace adjacent spaces immediately beside formatting characters
  let newText = text;
  for (let i = matches.length - 1; i >= 0; i--) {
    const matchText = matches[i][0];
    const replacementText = matchText.replace(
      /(\*|_)([\t \u00a0\u1680\u2000-\u200a\u202f\u205f\u3000\ufeff]+)|([\t \u00a0\u1680\u2000-\u200a\u202f\u205f\u3000\ufeff]+)(\*|_)/g,
      '$1$4',
    );
    newText = newText.slice(0, matches[i].index) + replacementText + newText.slice(matches[i].index + matchText.length);
  }

  const splitText = newText.split('\n');

  // Fix asterisks, and quotes that are not paired
  for (let index = 0; index < splitText.length; index++) {
    const line = splitText[index];
    const charsToCheck = ['*', '"'];
    for (const char of charsToCheck) {
      if (line.includes(char) && isOdd(countOccurrences(line, char))) {
        splitText[index] = line.trimEnd() + char;
      }
    }
  }

  newText = splitText.join('\n');
  return newText;
}

export function formatMessage(message: ChatMessage): string {
  const settingsStore = useSettingsStore();
  let mes = message.mes;
  if (!mes) return '';

  if (message?.extra?.display_text) {
    mes = message.extra.display_text;
  }

  // TODO: Add more complex logic from original messageFormatting, like param substitution, regex, etc.

  if (settingsStore.settings.chat.autoFixMarkdown && !message.is_system) {
    mes = fixMarkdown(mes);
  }

  if (!message.is_system) {
    // Basic quote handling similar to original
    mes = mes.replace(/"(.*?)"/g, '<q>"$1"</q>');
    mes = converter.makeHtml(mes);
  }

  const config: DOMPurify.Config = {
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    ADD_TAGS: ['custom-style', 'q'], // Allow <q> for quotes
  };

  return DOMPurify.sanitize(mes, config);
}
