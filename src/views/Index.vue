<script setup>
import { ref, reactive } from "vue";

const menu = reactive([
  {
    label: "首页",
    path: "/home",
  },
  {
    label: "运行",
    path: "/run",
  },
  {
    label: "交互",
    path: "/interaction",
  },
]);

const loading = ref(false);
</script>

<template>
  <div class="h-full p-4">
    <el-container
      class="h-full rounded-2xl bg-gray shadow-2xl overflow-hidden"
      v-loading="loading"
      element-loading-text="加载中..."
      element-loading-background="rgba(122, 122, 122, 0.8)"
    >
      <el-header class="flex items-center justify-center text-white font-bold">
        <template v-for="(item, index) in menu" :key="index">
          <router-link
            :to="item.path"
            :class="{ 'text-blue-500': $route.path === item.path }"
          >
            {{ item.label }}
          </router-link>
          <span v-if="index !== menu.length - 1" class="px-2">|</span>
        </template>
      </el-header>
      <el-main>
        <router-view
          :key="$route.path"
          @showLoading="loading = true"
          @hideLoading="loading = false"
        />
      </el-main>
    </el-container>
  </div>
</template>
