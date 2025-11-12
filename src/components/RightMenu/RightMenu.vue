<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useCharacterStore } from '../../stores/character.store';
import { default_avatar } from '../../constants';
import type { Character, Group } from '../../types';

const characterStore = useCharacterStore();
const isSearchActive = ref(false);
const isPanelPinned = ref(false);

function getAvatarUrl(avatar: string) {
  return avatar && avatar !== 'none' ? `/thumbnail?type=avatar&file=${encodeURIComponent(avatar)}` : default_avatar;
}

onMounted(() => {
  characterStore.refreshCharacters();
  // TODO: Load initial pin state from settings store / local storage
});
</script>

<template>
  <div class="flex-container flex-nowrap">
    <div class="flex-flow-column flex-container">
      <div class="align-items-flex-start" title="Locked = Character Management panel will stay open">
        <input id="rm-button-panel-pin" type="checkbox" v-model="isPanelPinned" />
        <label for="rm-button-panel-pin">
          <div class="fa-solid right-menu-button" :class="isPanelPinned ? 'fa-lock' : 'fa-unlock'"></div>
        </label>
      </div>
      <div class="right-menu-button fa-solid fa-list-ul" title="Select/Create Characters"></div>
    </div>
    <div class="align-items-center flex-container margin-0auto width-100p space-evenly">
      <div
        class="hotswap avatars-inline scroll-reset-container expander"
        title="Favorite characters to add them to HotSwaps"
      >
        <small>
          <span> <i class="fa-solid fa-star"></i>&nbsp;Favorite characters to add them to HotSwaps</span>
        </small>
      </div>
    </div>
  </div>
  <div class="scrollableInner">
    <div name="Character List Panel" id="rm-characters-block">
      <div id="char-list-fixed-top">
        <div id="rm-button-bar">
          <div id="rm-button-create" title="Create New Character" class="menu-button fa-solid fa-user-plus"></div>
          <div
            id="character-import-button"
            title="Import Character from File"
            class="menu-button fa-solid fa-file-import"
          ></div>
          <div
            id="external-import-button"
            title="Import content from external URL"
            class="menu-button fa-solid fa-cloud-arrow-down"
          ></div>
          <div id="rm-button-group-chats" title="Create New Chat Group" class="menu-button fa-solid fa-users-gear"></div>
          <div id="rm-buttons-container">
            <!-- Container for additional buttons added by extensions -->
          </div>
          <select id="character-sort-order" class="text-pole" title="Characters sorting order">
            <option data-field="search" data-order="desc" hidden>Search</option>
            <option data-field="name" data-order="asc">A-Z</option>
            <option data-field="name" data-order="desc">Z-A</option>
            <option data-field="create_date" data-order="desc">Newest</option>
            <option data-field="create_date" data-order="asc">Oldest</option>
            <option data-field="fav" data-order="desc" data-rule="boolean">Favorites</option>
            <option data-field="date_last_chat" data-order="desc">Recent</option>
            <option data-field="chat_size" data-order="desc">Most chats</option>
            <option data-field="chat_size" data-order="asc">Least chats</option>
            <option data-field="data_size" data-order="desc">Most tokens</option>
            <option data-field="data_size" data-order="asc">Least tokens</option>
            <option data-field="name" data-order="random">Random</option>
          </select>
          <div
            id="rm-button-search"
            class="right-menu-button fa-fw fa-solid fa-search"
            title="Toggle search bar"
            @click="isSearchActive = !isSearchActive"
          ></div>
        </div>
        <div id="form-character-search-form" :class="{ active: isSearchActive }">
          <input id="character-search-bar" class="text-pole width-100p" type="search" placeholder="Search..." />
        </div>
        <div class="rm-tag-controls">
          <div class="tags rm-tag-filter"></div>
          <div class="tags rm-tag-bogus-drilldown"></div>
        </div>
      </div>

      <div id="rm-print-characters-pagination">
        <i
          id="char-list-grid-toggle"
          class="fa-solid fa-table-cells-large menu-button"
          title="Toggle character grid view"
        ></i>
        <i
          id="bulk-edit-button"
          class="fa-solid fa-edit menu-button bulk-edit-button"
          title="Bulk edit characters&#13;&#13;Click to toggle characters&#13;Shift + Click to select/deselect a range of characters&#13;Right-click for actions"
        ></i>
        <div id="bulk-selected-count" class="bulk-edit-option-element paginationjs-nav"></div>
        <i
          id="bulk-select-all-button"
          class="fa-solid fa-check-double menu-button bulk-edit-option-element bulk-select-all-button"
          title="Bulk select all characters"
          style="display: none"
        ></i>
        <i
          id="bulk-delete-button"
          class="fa-solid fa-trash menu-button bulk-edit-option-element bulk-delete-button"
          title="Bulk delete characters"
          style="display: none"
        ></i>
      </div>
      <div id="rm-print-characters-block" class="flex-flow-column">
        <div v-if="characterStore.displayableEntities.length === 0">Loading...</div>
        <template v-for="entity in characterStore.displayableEntities" :key="entity.id">
          <!-- Character Block -->
          <div
            v-if="entity.type === 'character'"
            class="character_select"
            :class="{ selected_char: characterStore.activeCharacterIndex === entity.id }"
            @click="characterStore.selectCharacterById(entity.id as number)"
          >
            <div class="avatar">
              <img :src="getAvatarUrl((entity.item as Character).avatar)" alt="Character Avatar" />
            </div>
            <div class="ch_name">{{ (entity.item as Character).name }}</div>
          </div>

          <!-- Group Block -->
          <div v-if="entity.type === 'group'" class="character_select group_select">
            <!-- Group rendering logic here -->
            <div class="ch_name">GROUP: {{ (entity.item as Group).id }}</div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* Basic styles to replicate the character list appearance */
.character_select {
  display: flex;
  align-items: center;
  padding: 5px;
  cursor: pointer;
  border-radius: 5px;
  margin: 2px 0;

  &:hover {
    background-color: var(--white-20a);
  }

  &.selected_char {
    background-color: var(--color-active);
  }
}

.avatar img {
  width: 40px;
  height: 40px;
  border-radius: 5px;
  margin-right: 10px;
  object-fit: cover;
}

.ch_name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
