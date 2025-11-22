import { WorldInfoLogic, WorldInfoPosition, WorldInfoRole } from '../constants';
import type { CharacterBook, CharacterBookEntry } from '../types/character';
import type { WorldInfoBook, WorldInfoEntry } from '../types/world-info';

const DEFAULT_DEPTH = 4;
const DEFAULT_WEIGHT = 100;

export function convertCharacterBookToWorldInfoBook(charBook: CharacterBook): WorldInfoBook {
  const entries: WorldInfoEntry[] = (charBook.entries || []).map((entry, index) => {
    // ID Fallback
    const uid = entry.id !== undefined ? entry.id : index;

    return {
      uid,
      key: entry.keys || [],
      keysecondary: entry.secondary_keys || [],
      comment: entry.comment || '',
      content: entry.content || '',
      constant: entry.constant || false,
      selective: entry.selective || false,
      order: entry.insertion_order || 100,
      position:
        entry.extensions?.position ??
        (entry.position === 'before_char' ? WorldInfoPosition.BEFORE_CHAR : WorldInfoPosition.AFTER_CHAR),
      excludeRecursion: entry.extensions?.exclude_recursion ?? false,
      preventRecursion: entry.extensions?.prevent_recursion ?? false,
      delayUntilRecursion: entry.extensions?.delay_until_recursion ?? false,
      disable: entry.enabled === false, // Defaults to true if undefined in some contexts, but usually enabled exists
      addMemo: !!entry.comment,
      probability: entry.extensions?.probability ?? 100,
      useProbability: entry.extensions?.useProbability ?? true,
      depth: entry.extensions?.depth ?? DEFAULT_DEPTH,
      selectiveLogic: entry.extensions?.selectiveLogic ?? WorldInfoLogic.AND_ANY,
      outletName: entry.extensions?.outlet_name ?? '',
      group: entry.extensions?.group ?? '',
      groupOverride: entry.extensions?.group_override ?? false,
      groupWeight: entry.extensions?.group_weight ?? DEFAULT_WEIGHT,
      scanDepth: entry.extensions?.scan_depth ?? null,
      caseSensitive: entry.extensions?.case_sensitive ?? null,
      matchWholeWords: entry.extensions?.match_whole_words ?? null,
      useGroupScoring: entry.extensions?.use_group_scoring ?? null,
      automationId: entry.extensions?.automation_id ?? '',
      role: entry.extensions?.role ?? WorldInfoRole.SYSTEM,
      vectorized: entry.extensions?.vectorized ?? false,
      sticky: entry.extensions?.sticky ?? null,
      cooldown: entry.extensions?.cooldown ?? null,
      delay: entry.extensions?.delay ?? null,
      matchPersonaDescription: entry.extensions?.match_persona_description ?? false,
      matchCharacterDescription: entry.extensions?.match_character_description ?? false,
      matchCharacterPersonality: entry.extensions?.match_character_personality ?? false,
      matchCharacterDepthPrompt: entry.extensions?.match_character_depth_prompt ?? false,
      matchScenario: entry.extensions?.match_scenario ?? false,
      matchCreatorNotes: entry.extensions?.match_creator_notes ?? false,
      characterFilterNames: [], // Not present in basic charbook
      characterFilterTags: [], // Not present in basic charbook
      characterFilterExclude: false,
      triggers: entry.extensions?.triggers || [],
      ignoreBudget: entry.extensions?.ignore_budget ?? false,
    };
  });

  return {
    name: charBook.name || 'Embedded Lorebook',
    entries,
  };
}

export function convertWorldInfoBookToCharacterBook(wiBook: WorldInfoBook): CharacterBook {
  const entries: CharacterBookEntry[] = wiBook.entries.map((entry) => {
    return {
      id: entry.uid,
      keys: entry.key,
      secondary_keys: entry.keysecondary,
      comment: entry.comment,
      content: entry.content,
      constant: entry.constant,
      selective: entry.selective,
      insertion_order: entry.order,
      enabled: !entry.disable,
      position: entry.position === WorldInfoPosition.BEFORE_CHAR ? 'before_char' : 'after_char',
      use_regex: true, // Default assumption for modern ST
      extensions: {
        position: entry.position,
        exclude_recursion: entry.excludeRecursion,
        prevent_recursion: entry.preventRecursion,
        delay_until_recursion: entry.delayUntilRecursion,
        probability: entry.probability,
        useProbability: entry.useProbability,
        depth: entry.depth,
        selectiveLogic: entry.selectiveLogic,
        outlet_name: entry.outletName,
        group: entry.group,
        group_override: entry.groupOverride,
        group_weight: entry.groupWeight,
        scan_depth: entry.scanDepth,
        case_sensitive: entry.caseSensitive,
        match_whole_words: entry.matchWholeWords,
        use_group_scoring: entry.useGroupScoring,
        automation_id: entry.automationId,
        role: entry.role,
        vectorized: entry.vectorized,
        sticky: entry.sticky,
        cooldown: entry.cooldown,
        delay: entry.delay,
        match_persona_description: entry.matchPersonaDescription,
        match_character_description: entry.matchCharacterDescription,
        match_character_personality: entry.matchCharacterPersonality,
        match_character_depth_prompt: entry.matchCharacterDepthPrompt,
        match_scenario: entry.matchScenario,
        match_creator_notes: entry.matchCreatorNotes,
        triggers: entry.triggers,
        ignore_budget: entry.ignoreBudget,
      },
    };
  });

  return {
    name: wiBook.name,
    entries,
  };
}
