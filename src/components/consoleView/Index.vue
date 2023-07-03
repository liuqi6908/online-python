<template>
  <div
    class="console-view bg-black text-base text-white p-2 rounded whitespace-pre-wrap min-h-[200px] max-h-[500px] scrollbar"
  >
    <div
      v-for="(item, i) in data.filter((v) => v.text)"
      :key="i"
      :class="item.type"
    >
      {{ item.text }}
    </div>
  </div>
</template>

<script setup>
defineProps({
  data: {
    type: Array,
    default: [],
  },
});
</script>

<style scoped lang="scss">
.console-view {
  font-family: monospace;

  .code::before {
    content: ">>>";
    margin-right: 8px;
  }

  .error {
    color: #f56c6c;
  }
}
</style>
