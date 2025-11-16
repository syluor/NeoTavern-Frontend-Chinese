import Showdown from 'showdown';
import DOMPurify from 'dompurify';
import type { ChatMessage } from '../types';

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

export function formatMessage(message: ChatMessage): string {
  let mes = message.mes;
  if (!mes) return '';

  if (message?.extra?.display_text) {
    mes = message.extra.display_text;
  }

  // TODO: Add more complex logic from original messageFormatting, like param substitution, regex, etc.

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
