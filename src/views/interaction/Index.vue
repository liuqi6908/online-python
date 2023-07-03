<template>
  <div class="h-full m-auto flex flex-col interaction" @click="handleClick">
    <h1 class="text-white mb-4 flex items-center">
      控制台
      <el-tooltip placement="top">
        <template #content>
          快捷键：
          <br />
          回车：运行代码
          <br />
          Alt + 回车：换行
          <br />
          Alt + L：清空控制台
        </template>
        <el-icon class="ml-2"><QuestionFilled /></el-icon>
      </el-tooltip>
    </h1>
    <div
      class="console-editor w-full h-full bg-black text-base text-white p-2 rounded whitespace-pre-wrap break-all scrollbar"
    >
      <div
        v-for="(item, i) in output.filter((v) => v.text)"
        :key="i"
        :class="item.type"
        class="flex items-baseline"
      >
        <div class="flex-1">{{ item.text }}</div>
      </div>
      <el-input
        v-if="inputVisible"
        ref="InputRef"
        :class="code ? 'other' : 'first'"
        v-model="input"
        type="textarea"
        :autosize="true"
        resize="none"
        @keydown="handleKeyDown"
      ></el-input>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onBeforeMount, nextTick } from "vue";

import { QuestionFilled } from "@element-plus/icons-vue";

const emit = defineEmits(["showLoading", "hideLoading"]);

const output = reactive([]);
const inputVisible = ref(true);
const input = ref("");
const InputRef = ref();

let code = "";
let pyodide;

onBeforeMount(async () => {
  /** 加载页面 */
  emit("showLoading");

  /** 初始化pyodide */
  pyodide = await loadPyodide();

  /** 关闭页面加载 */
  emit("hideLoading");
});

function handleClick() {
  nextTick(() => {
    InputRef.value?.textarea?.focus();
  });
}

/** 快捷键 */
function handleKeyDown(event) {
  // 按下回车键
  if (event.key === "Enter") {
    // enter（运行）
    if (!event.altKey) runCode();
    // alt + enter（换行）
    else lineFeed();
    event.preventDefault();
  }
  // alt + L（清空）
  else if (event.altKey && event.code === "KeyL") {
    emptyConsole();
    event.preventDefault();
  }
  // tab（缩进）
  else if (event.key === "Tab") {
    input.value += "    ";
    event.preventDefault();
  }
}

/** 清空控制台 */
function emptyConsole() {
  output.splice(0, output.length);
}

/** 换行 */
function lineFeed() {
  const str = input.value + "\n";
  if (!code) {
    output.push({
      text: str,
      type: "first",
    });
  } else {
    output.push({
      text: str,
      type: "other",
    });
  }
  code += str;
  input.value = "";
}

/** 运行代码 */
async function runCode() {
  lineFeed();
  inputVisible.value = false;
  try {
    // 加载包
    await pyodide.loadPackagesFromImports(code);

    // 重定向console.log输出
    let result = [];

    console.log = function (...args) {
      args.map((v) => {
        result.push(v + "\n");
      });
    };

    // 运行代码
    result.push(pyodide.runPython(code));
    if (result && result.length > 0)
      output.push({
        text: result.join(""),
        type: "result",
      });
  } catch (e) {
    if (e)
      output.push({
        text: e.message,
        type: "error",
      });
  } finally {
    code = "";
    inputVisible.value = true;
    nextTick(() => {
      InputRef.value?.textarea?.focus();
    });
  }
}
</script>

<style scoped lang="scss">
.interaction {
  padding: 0 calc((100% - 50rem) / 2);

  .console-editor {
    font-family: monospace;

    > div.first::before,
    .el-textarea.first::before {
      content: ">>>";
      margin-right: 8px;
    }

    > div.other::before,
    .el-textarea.other::before {
      content: "...";
      margin-right: 8px;
    }

    .error {
      color: #f56c6c;
    }

    :deep(.el-textarea) {
      display: flex;
      align-items: baseline;
      font-size: 16px;

      textarea {
        flex: 1;
        background: transparent;
        color: white;
        padding: 0;
        box-shadow: none;
      }
    }
  }
}
</style>
