import {
  type ChatMessage,
  type Character,
  type WorldInfoBook,
  type WorldInfoEntry,
  type WorldInfoSettings,
  WorldInfoLogic,
  WorldInfoPosition,
} from '../types';

// TODO: These should be sourced from a central place or settings
const MAX_SCAN_DEPTH = 1000;

// TODO: A simplified substitution, a full implementation would be more robust
function substituteParams(text: string, char: Character, user: string): string {
  if (!text) return '';
  return text.replace(/{{char}}/g, char.name).replace(/{{user}}/g, user);
}

// --- WorldInfoBuffer Class ---
// Manages the text content (chat history, descriptions) to be scanned.
class WorldInfoBuffer {
  #depthBuffer: string[] = [];
  #recurseBuffer: string[] = [];
  #settings: WorldInfoSettings;
  #character: Character;
  // TODO: Add persona, etc.

  constructor(chat: ChatMessage[], settings: WorldInfoSettings, character: Character) {
    this.#settings = settings;
    this.#character = character;
    this.#initDepthBuffer(chat);
  }

  #initDepthBuffer(chat: ChatMessage[]) {
    // We only need the message content, reversed (most recent first)
    this.#depthBuffer = chat
      .map((msg) => msg.mes)
      .reverse()
      .slice(0, MAX_SCAN_DEPTH);
  }

  #transformString(str: string, entry: WorldInfoEntry): string {
    const caseSensitive = entry.caseSensitive ?? this.#settings.world_info_case_sensitive;
    return caseSensitive ? str : str.toLowerCase();
  }

  // Gets the full text to be scanned for a given entry
  get(entry: WorldInfoEntry): string {
    const depth = entry.scanDepth ?? this.#settings.world_info_depth;
    let buffer = this.#depthBuffer.slice(0, depth).join('\n');

    // Add other scannable sources
    if (entry.matchCharacterDescription) buffer += `\n${this.#character.description ?? ''}`;
    if (entry.matchCharacterPersonality) buffer += `\n${this.#character.personality ?? ''}`;
    // TODO: Add persona, scenario, creator notes etc.

    if (this.#recurseBuffer.length > 0) {
      buffer += `\n${this.#recurseBuffer.join('\n')}`;
    }

    return buffer;
  }

  // Checks if a given keyword (needle) exists in the buffer (haystack)
  matchKeys(haystack: string, needle: string, entry: WorldInfoEntry): boolean {
    // TODO: Implement regex support from original `parseRegexFromString`
    const transformedHaystack = this.#transformString(haystack, entry);
    const transformedNeedle = this.#transformString(needle, entry);
    const matchWholeWords = entry.matchWholeWords ?? this.#settings.world_info_match_whole_words;

    if (matchWholeWords) {
      // Simple whole word match for single words
      if (!transformedNeedle.includes(' ')) {
        const regex = new RegExp(`\\b${transformedNeedle}\\b`);
        return regex.test(transformedHaystack);
      }
    }
    return transformedHaystack.includes(transformedNeedle);
  }

  addRecurse(message: string) {
    this.#recurseBuffer.push(message);
  }
}

// --- Main Processor ---
export class WorldInfoProcessor {
  private chat: ChatMessage[];
  private character: Character;
  private settings: WorldInfoSettings;
  private books: WorldInfoBook[];
  private playerName: string;

  constructor(
    chat: ChatMessage[],
    character: Character,
    settings: WorldInfoSettings,
    books: WorldInfoBook[],
    playerName: string,
  ) {
    this.chat = chat;
    this.character = character;
    this.settings = settings;
    this.books = books;
    this.playerName = playerName;
  }

  public process(): { worldInfoBefore: string; worldInfoAfter: string } {
    const buffer = new WorldInfoBuffer(this.chat, this.settings, this.character);
    let allActivatedEntries = new Set<WorldInfoEntry>();
    let continueScanning = true;
    let loopCount = 0;

    const allEntries = this.books.flatMap((book) => book.entries.map((entry) => ({ ...entry, world: book.name })));
    // TODO: Implement proper sorting based on order, priority etc.
    const sortedEntries = allEntries.sort((a, b) => (a.order ?? 100) - (b.order ?? 100));

    // TODO: Implement TimedEffects for sticky/cooldown
    // TODO: Implement Min Activations logic

    while (continueScanning && loopCount < (this.settings.world_info_max_recursion_steps || 10)) {
      loopCount++;
      let activatedInThisLoop = new Set<WorldInfoEntry>();
      let newContentForRecursion = '';

      for (const entry of sortedEntries) {
        if (allActivatedEntries.has(entry) || entry.disable) continue;

        // TODO: Add all filters: character, tags, timed effects etc.

        if (entry.constant) {
          activatedInThisLoop.add(entry);
          continue;
        }

        if (!entry.key || entry.key.length === 0) continue;

        const textToScan = buffer.get(entry);
        if (!textToScan) continue;

        const hasPrimaryKeyMatch = entry.key.some((key) => {
          const subbedKey = substituteParams(key, this.character, this.playerName);
          return subbedKey && buffer.matchKeys(textToScan, subbedKey, entry);
        });

        if (hasPrimaryKeyMatch) {
          const hasSecondary = entry.keysecondary && entry.keysecondary.length > 0;
          if (!hasSecondary) {
            activatedInThisLoop.add(entry);
            continue;
          }

          // Handle secondary key logic
          let hasAnySecondaryMatch = false;
          let hasAllSecondaryMatch = true;
          for (const key of entry.keysecondary) {
            const subbedKey = substituteParams(key, this.character, this.playerName);
            if (subbedKey && buffer.matchKeys(textToScan, subbedKey, entry)) {
              hasAnySecondaryMatch = true;
            } else {
              hasAllSecondaryMatch = false;
            }
          }

          let secondaryLogicPassed = false;
          switch (entry.selectiveLogic as WorldInfoLogic) {
            case WorldInfoLogic.AND_ANY:
              secondaryLogicPassed = hasAnySecondaryMatch;
              break;
            case WorldInfoLogic.AND_ALL:
              secondaryLogicPassed = hasAllSecondaryMatch;
              break;
            case WorldInfoLogic.NOT_ALL:
              secondaryLogicPassed = !hasAllSecondaryMatch;
              break;
            case WorldInfoLogic.NOT_ANY:
              secondaryLogicPassed = !hasAnySecondaryMatch;
              break;
          }

          if (secondaryLogicPassed) {
            activatedInThisLoop.add(entry);
          }
        }
      }

      // TODO: Filter by inclusion groups

      if (activatedInThisLoop.size > 0) {
        for (const entry of activatedInThisLoop) {
          // TODO: Probability checks and budget checks
          allActivatedEntries.add(entry);
          if (this.settings.world_info_recursive && !entry.preventRecursion) {
            newContentForRecursion += `\n${substituteParams(entry.content, this.character, this.playerName)}`;
          }
        }

        if (newContentForRecursion) {
          buffer.addRecurse(newContentForRecursion);
          continueScanning = true;
        } else {
          continueScanning = false;
        }
      } else {
        continueScanning = false;
      }
    }

    // Build the final prompt strings
    let worldInfoBefore = '';
    let worldInfoAfter = '';

    const finalEntries = Array.from(allActivatedEntries).sort((a, b) => (a.order ?? 100) - (b.order ?? 100));

    for (const entry of finalEntries) {
      const content = substituteParams(entry.content, this.character, this.playerName);
      if (entry.position === WorldInfoPosition.BEFORE_CHAR) {
        worldInfoBefore += `${content}\n`;
      } else {
        worldInfoAfter += `${content}\n`;
      }
      // TODO: Handle other positions (AN, EM, at Depth, Outlet)
    }

    return {
      worldInfoBefore: worldInfoBefore.trim(),
      worldInfoAfter: worldInfoAfter.trim(),
    };
  }
}
