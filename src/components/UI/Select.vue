<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts" generic="T extends string | number">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import Icon from './Icon.vue';

interface Option<T> {
  label: string;
  value: T;
  disabled?: boolean;
}

interface Props {
  modelValue: T | T[];
  options: Option<T>[];
  label?: string;
  disabled?: boolean;
  title?: string;
  multiple?: boolean;
  placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  multiple: false,
  disabled: false,
  label: undefined,
  title: undefined,
  placeholder: 'Select...',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: T | T[]): void;
  (e: 'change', value: T | T[]): void;
}>();

const isOpen = ref(false);
const containerRef = ref<HTMLElement | null>(null);

function toggleOpen() {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
}

function close() {
  isOpen.value = false;
}

function isSelected(value: T): boolean {
  if (props.multiple && Array.isArray(props.modelValue)) {
    return props.modelValue.includes(value);
  }
  return props.modelValue === value;
}

function selectOption(option: Option<T>) {
  if (option.disabled) return;

  if (props.multiple) {
    const currentValues = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
    const index = currentValues.indexOf(option.value);

    if (index === -1) {
      currentValues.push(option.value);
    } else {
      currentValues.splice(index, 1);
    }

    emit('update:modelValue', currentValues);
    emit('change', currentValues);
    // Keep open for multiple selection
  } else {
    emit('update:modelValue', option.value);
    emit('change', option.value);
    close();
  }
}

const displayValue = computed(() => {
  if (props.multiple && Array.isArray(props.modelValue)) {
    if (props.modelValue.length === 0) return props.placeholder;

    const selectedLabels = props.modelValue
      .map((val) => props.options.find((opt) => opt.value === val)?.label)
      .filter(Boolean);

    if (selectedLabels.length === 0) return props.placeholder;
    return selectedLabels.join(', ');
  }

  const selectedOption = props.options.find((opt) => opt.value === props.modelValue);
  return selectedOption ? selectedOption.label : props.placeholder;
});

function onClickOutside(event: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    close();
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside);
});

// Close if disabled changes to true
watch(
  () => props.disabled,
  (newVal) => {
    if (newVal) close();
  },
);
</script>

<template>
  <div ref="containerRef" class="select-wrapper">
    <label v-if="label" class="select-label">{{ label }}</label>

    <div
      class="select-trigger text-pole"
      :class="{ 'is-open': isOpen, 'is-disabled': disabled }"
      :title="title"
      @click="toggleOpen"
    >
      <div class="selected-text">{{ displayValue }}</div>
      <Icon icon="fa-chevron-down" class="chevron-icon" :class="{ 'rotate-180': isOpen }" />
    </div>

    <Transition name="fade-fast">
      <div v-if="isOpen" class="select-dropdown">
        <div
          v-for="opt in options"
          :key="String(opt.value)"
          class="select-option"
          :class="{
            'is-selected': isSelected(opt.value),
            'is-disabled': opt.disabled,
          }"
          @click.stop="selectOption(opt)"
        >
          <div v-if="multiple" class="option-checkbox">
            <Icon v-if="isSelected(opt.value)" icon="fa-check" class="check-icon" />
          </div>
          <span class="option-label">{{ opt.label }}</span>
          <Icon v-if="!multiple && isSelected(opt.value)" icon="fa-check" class="check-icon-single" />
        </div>
        <div v-if="options.length === 0" class="select-option is-disabled">No options</div>
      </div>
    </Transition>
  </div>
</template>
