<script setup lang="ts">
import { ref, type PropType } from 'vue';
import type { WorldInfoEntry } from '../../types';
import { slideTransitionHooks } from '../../utils/dom';

const props = defineProps({
  modelValue: {
    type: Object as PropType<WorldInfoEntry>,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue', 'delete', 'duplicate', 'move']);

const { beforeEnter, enter, afterEnter, beforeLeave, leave } = slideTransitionHooks;

const isExpanded = ref(false);

// Helper to update the model value immutably
function updateValue<K extends keyof WorldInfoEntry>(key: K, value: WorldInfoEntry[K]) {
  emit('update:modelValue', { ...props.modelValue, [key]: value });
}
</script>

<!-- TODO: Use i18n -->
<template>
  <div class="world-entry" :class="{ 'is-disabled': modelValue.disable }">
    <form class="world-entry__form">
      <div class="inline-drawer">
        <div class="inline-drawer-header">
          <div class="world-entry__main-controls">
            <i
              class="fa-solid inline-drawer-icon"
              :class="isExpanded ? 'fa-circle-chevron-up' : 'fa-circle-chevron-down'"
              @click="isExpanded = !isExpanded"
            ></i>
            <i
              class="fa-solid"
              :class="modelValue.disable ? 'fa-toggle-off' : 'fa-toggle-on'"
              @click="updateValue('disable', !modelValue.disable)"
              title="Toggle entry's active state"
            ></i>
            <textarea
              class="text-pole"
              rows="1"
              :value="modelValue.comment"
              @input="updateValue('comment', ($event.target as HTMLTextAreaElement).value)"
              placeholder="Entry Title/Memo"
            ></textarea>
            <!-- TODO: Entry State Selector (Constant, Normal, Vectorized) -->
          </div>
          <div class="world-entry__actions">
            <i class="menu-button fa-solid fa-right-left" title="Move/Copy Entry" @click="$emit('move')"></i>
            <i class="menu-button fa-solid fa-paste" title="Duplicate Entry" @click="$emit('duplicate')"></i>
            <i class="menu-button fa-solid fa-trash-can" title="Delete Entry" @click="$emit('delete')"></i>
          </div>
        </div>

        <transition
          name="slide-js"
          @before-enter="beforeEnter"
          @enter="enter"
          @after-enter="afterEnter"
          @before-leave="beforeLeave"
          @leave="leave"
        >
          <div v-show="isExpanded" class="inline-drawer-content world-entry__content">
            <!-- Keywords and Logic -->
            <div class="world-entry__section u-flex u-items-center">
              <div class="u-flex-col flex-1">
                <small>Primary Keywords</small>
                <textarea
                  class="text-pole"
                  rows="1"
                  :value="modelValue.key.join(', ')"
                  @input="
                    updateValue(
                      'key',
                      ($event.target as HTMLTextAreaElement).value.split(',').map((k) => k.trim()),
                    )
                  "
                  placeholder="Comma separated list"
                ></textarea>
              </div>
              <div class="u-flex-col">
                <small>Logic</small>
                <select
                  class="text-pole"
                  :value="modelValue.selectiveLogic"
                  @change="updateValue('selectiveLogic', Number(($event.target as HTMLSelectElement).value))"
                >
                  <option value="0">AND ANY</option>
                  <option value="3">AND ALL</option>
                  <option value="1">NOT ALL</option>
                  <option value="2">NOT ANY</option>
                </select>
              </div>
              <div class="u-flex-col flex-1">
                <small>Optional Filter</small>
                <textarea
                  class="text-pole"
                  rows="1"
                  :value="modelValue.keysecondary.join(', ')"
                  @input="
                    updateValue(
                      'keysecondary',
                      ($event.target as HTMLTextAreaElement).value.split(',').map((k) => k.trim()),
                    )
                  "
                  placeholder="Comma separated list (ignored if empty)"
                ></textarea>
              </div>
            </div>

            <!-- Content -->
            <div class="world-entry__section u-flex-col">
              <label class="u-flex u-justify-between">
                <small>Content</small>
                <small>(UID: {{ modelValue.uid }})</small>
              </label>
              <textarea
                class="text-pole"
                rows="6"
                :value="modelValue.content"
                @input="updateValue('content', ($event.target as HTMLTextAreaElement).value)"
                placeholder="What this keyword should mean to the AI..."
              ></textarea>
            </div>
            <!-- TODO: Add all other fields like position, depth, groups, filters etc. -->
          </div>
        </transition>
      </div>
    </form>
  </div>
</template>
