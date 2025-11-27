import { JSDOM } from 'jsdom';
import { beforeAll, describe, expect, test } from 'vitest';
import { formatText } from '../src/utils/chat';

describe('Chat Utils', () => {
  beforeAll(() => {
    if (typeof global.DOMParser === 'undefined') {
      const jsdom = new JSDOM('');
      global.DOMParser = jsdom.window.DOMParser;
      global.document = jsdom.window.document;
      global.Node = jsdom.window.Node;
      global.window = jsdom.window as unknown as Window & typeof globalThis;
    }
  });

  describe('formatText', () => {
    test('renders images when external media is allowed', () => {
      const input = '![alt text](https://example.com/image.png)';
      const result = formatText(input, false);
      // formatText scopes html, so look for img tag inside
      expect(result).toContain('<img');
      expect(result).toContain('src="https://example.com/image.png"');
    });

    test('removes images when external media is forbidden', () => {
      const input = '![alt text](https://example.com/image.png)';
      const result = formatText(input, true);
      expect(result).not.toContain('<img');
      expect(result).not.toContain('src="https://example.com/image.png"');
    });

    test('allows regular text', () => {
      const input = 'Hello world';
      const result = formatText(input, true);
      expect(result).toContain('Hello world');
    });

    test('sanitizes scripts regardless of setting', () => {
      const input = '<script>alert("xss")</script>Hello';
      const resultAllowed = formatText(input, false);
      const resultForbidden = formatText(input, true);

      expect(resultAllowed).not.toContain('<script');
      expect(resultForbidden).not.toContain('<script');
    });

    test('removes audio/video when forbidden', () => {
      const input = '<video src="movie.mp4"></video>';
      const result = formatText(input, true);
      expect(result).not.toContain('<video');
    });
  });
});
