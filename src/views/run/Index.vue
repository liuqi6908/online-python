<template>
  <div class="h-full m-auto none-scrollbar run">
    <h1 class="text-white mb-4">标题</h1>
    <el-input v-model="obj.title"></el-input>
    <h1 class="text-white my-4 flex items-center">
      加载模块
      <el-tooltip placement="top">
        <template #content>
          <ul>
            <li>点击下方按钮输入模块名或下载链接</li>
            <li>按下回车等待片刻即可加载成功</li>
            <li>已加载模块可在下方代码中直接import</li>
            <li>
              注：
              <ul class="ml-6">
                <li class="list-disc">
                  内置的模块列表见<el-link
                    style="font-size: 12px"
                    href="https://pyodide.org/en/stable/usage/packages-in-pyodide.html"
                    target="_blank"
                    type="primary"
                    >Pyodide官网</el-link
                  >
                </li>
                <li class="list-disc">
                  模块下载链接可前往<el-link
                    style="font-size: 12px"
                    href="https://pypi.org/"
                    target="_blank"
                    type="primary"
                    >PyPI官网</el-link
                  >自行查找
                </li>
                <li class="list-disc">
                  通过下载链接不能加载该模块的其他依赖项
                </li>
              </ul>
            </li>
          </ul>
        </template>
        <el-icon class="ml-2"><QuestionFilled /></el-icon>
      </el-tooltip>
    </h1>
    <el-tag
      v-for="tag in obj.packages"
      :key="tag"
      class="mr-2 mb-2 overflow-y-auto max-w-full !justify-start none-scrollbar"
      :disable-transitions="true"
    >
      {{ tag }}
    </el-tag>
    <el-input
      v-if="inputVisible"
      ref="InputRef"
      v-model="inputValue"
      style="width: 5rem"
      size="small"
      @keyup.enter="addPackage"
      @blur="addPackage"
    />
    <el-button v-else class="w-20" size="small" @click="showInput">
      + 添加
    </el-button>
    <h1 class="text-white my-4 flex items-center">
      代码
      <el-tooltip placement="top">
        <template #content>
          快捷键：
          <br />
          Alt + 回车：运行代码
          <br />
          Alt + L：清空控制台
          <br />
          Alt + S：保存会话
        </template>
        <el-icon class="ml-2"><QuestionFilled /></el-icon>
      </el-tooltip>
    </h1>
    <Codemirror
      v-model="obj.code"
      placeholder="请输入代码..."
      class="text-base"
      style="min-height: 300px; max-height: 500px"
      :autofocus="true"
      :indent-with-tab="true"
      :tabSize="4"
      :extensions="extensions"
      @keydown="handleKeyDown"
    />
    <el-button-group class="my-4">
      <el-upload
        ref="UploadRef"
        class="float-left"
        action=""
        :show-file-list="false"
        accept=".txt,.py"
        :on-change="handleChange"
        :auto-upload="false"
        :limit="1"
      >
        <el-button class="upload-button" type="primary">文件</el-button>
      </el-upload>
      <el-button type="primary" @click="resetCode">重置</el-button>
      <el-button type="primary" @click="runCode" :disabled="disabled"
        >运行</el-button
      >
    </el-button-group>
    <h1 class="text-white mb-4">输出</h1>
    <ConsoleView :data="obj.output" />
    <el-button-group class="my-4">
      <el-button type="primary" @click="emptyConsole">清空</el-button>
      <el-button type="primary" @click="saveSession">保存</el-button>
    </el-button-group>
  </div>
</template>

<script setup>
import { generateId } from "../../utils/generate";
import { formatDateTime } from "../../utils/formatting";
import {
  ref,
  reactive,
  onBeforeMount,
  onMounted,
  nextTick,
  computed,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { QuestionFilled } from "@element-plus/icons-vue";

/** 引入codemirror（代码编辑器） */
import { Codemirror } from "vue-codemirror";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";

/** 引入组件 */
import ConsoleView from "../../components/consoleView/Index.vue";

const emit = defineEmits(["showLoading", "hideLoading"]);

const list = reactive([]);
const obj = reactive({
  id: null,
  dateTime: null,
  title: "",
  packages: [],
  code: "",
  output: [],
});

const $route = useRoute();
const $router = useRouter();

const inputVisible = ref(false);
const inputValue = ref("");
const InputRef = ref();

const extensions = reactive([python(), oneDark]);

let pyodide;

const UploadRef = ref();

const disabled = computed(() => {
  return !Boolean(obj.code);
});

onBeforeMount(async () => {
  /** 加载页面 */
  emit("showLoading");

  /** 初始化参数 */
  const id = $route.query.id;
  const data = localStorage.getItem("data");
  if (data && Array.isArray(JSON.parse(data))) {
    list.push(...JSON.parse(data));
  }
  const item = list.find((v) => v.id === id) || [];
  obj.id = item.id || null;
  obj.dateTime = item.dateTime || null;
  obj.title = item.title || "";
  obj.packages = item.packages || [];
  obj.code = item.code || "";
  obj.output = item.output || [];

  /** 初始化pyodide */
  pyodide = await loadPyodide();

  for (let i = obj.packages.length - 1; i >= 0; i--) {
    if (await loadPackage(obj.packages[i])) obj.packages.splice(i, 1);
  }

  /** 关闭页面加载 */
  emit("hideLoading");
});

onMounted(() => {
  /** 修改代码编辑器滚动条样式 */
  nextTick(() => {
    const dom = document.getElementsByClassName("cm-scroller");
    for (let i = 0; i < dom.length; i++) {
      dom[i].className += " scrollbar";
    }
  });
});

/** 显示添加模块输入框 */
function showInput() {
  inputVisible.value = true;
  inputValue.value = "";
  nextTick(() => {
    InputRef.value?.input?.focus();
  });
}

/** 加载第三方模块 */
async function addPackage() {
  if (inputValue.value) {
    if (obj.packages.includes(inputValue.value)) {
      ElMessage({
        message: `${inputValue.value}模块已加载`,
        type: "warning",
        grouping: true,
        showClose: true,
      });
    } else {
      emit("showLoading");
      const flag = await loadPackage(inputValue.value);
      if (flag) {
        ElMessage({
          message: flag,
          type: "error",
          grouping: true,
          showClose: true,
        });
      } else {
        ElMessage({
          message: `${inputValue.value}模块已完成加载`,
          type: "success",
          grouping: true,
          showClose: true,
        });
        obj.packages.push(inputValue.value);
      }
      emit("hideLoading");
    }
  }
  inputVisible.value = false;
  inputValue.value = "";
}

/** 加载第三方模块 */
async function loadPackage(name) {
  try {
    await pyodide.loadPackage(name);
    return false;
  } catch (e) {
    console.log(e);
    let message = "加载失败，";
    message += e.message?.includes("No known package with name")
      ? `没有名为 “${inputValue.value}” 的已知模块`
      : "未知错误";
    return message;
  }
}

/** 添加文件 */
function handleChange(file) {
  const type = file.raw.type;
  /** 可处理文件类型白名单 */
  const whiteList = ["text/plain", "text/x-python"];
  if (whiteList.includes(type)) {
    readFile(file.raw)
      .then((text) => {
        obj.code = text;
      })
      .catch((e) => {
        ElMessage({
          message: e.message,
          type: "error",
          grouping: true,
          showClose: true,
        });
      });
  } else {
    ElMessage({
      message: "只允许上传 .txt .py 格式文件",
      type: "warning",
      grouping: true,
      showClose: true,
    });
  }
  UploadRef.value?.clearFiles();
}

/** 读取文件内容 */
function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsText(file);
  });
}

/** 重置代码 */
async function resetCode() {
  /** 加载页面 */
  emit("showLoading");

  $router.push({
    query: {},
  });

  obj.id = null;
  obj.dateTime = null;
  obj.title = "";
  obj.packages = [];
  obj.code = "";
  obj.output = [];

  /** 初始化pyodide */
  pyodide = await loadPyodide();

  /** 关闭页面加载 */
  emit("hideLoading");
}

/** 保存会话 */
function saveSession() {
  let message;
  if (list.findIndex((v) => v.id === obj.id) < 0) {
    message = "保存成功！";
    obj.id = obj.id || generateId();
    obj.dateTime = obj.dateTime || formatDateTime();
    list.push({
      id: obj.id,
      dateTime: obj.dateTime,
      title: obj.title.trim() || "未命名",
      packages: obj.packages || [],
      code: obj.code || "",
      output: obj.output || [],
    });
    $router.push({
      query: {
        id: obj.id,
      },
    });
  } else {
    message = "更新成功！";
    const item = list.find((v) => v.id === obj.id);
    item.title = obj.title || "";
    item.packages = obj.packages || [];
    item.code = obj.code || "";
    item.output = obj.output || [];
  }
  localStorage.setItem("data", JSON.stringify(list));
  ElMessage({
    message,
    type: "success",
    grouping: true,
    showClose: true,
  });
}

/** 运行代码 */
function runCode() {
  if (!pyodide || !obj.code) return;
  emit("showLoading");
  obj.output = [];
  setTimeout(async () => {
    try {
      obj.output.push({
        text: "运行中...",
        type: "code",
      });

      // 加载包
      await pyodide.loadPackagesFromImports(obj.code);

      // 重定向console.log输出
      let result = [];

      console.log = function (...args) {
        args.map((v) => {
          result.push(v + "\n");
        });
      };

      // 运行代码
      result.push(pyodide.runPython(obj.code));
      if (result && result.length > 0)
        obj.output.push({
          text: result.join(""),
          type: "result",
        });
    } catch (e) {
      if (e)
        obj.output.push({
          text: e.message,
          type: "error",
        });
    } finally {
      setTimeout(() => {
        obj.output.push({
          text: "\n进程结束",
          type: "result",
        });
        emit("hideLoading");
      }, 100);
    }
  }, 100);
}

/** 清空控制台 */
function emptyConsole() {
  obj.output = [];
}

/** 快捷键 */
function handleKeyDown(event) {
  // 按下alt键
  if (event && event.altKey) {
    // alt + enter（运行）
    if (event.key === "Enter") {
      runCode();
      event.preventDefault();
    }
    // alt + L（清空）
    else if (event.code === "KeyL") {
      emptyConsole();
      event.preventDefault();
    }
    // alt + S（保存）
    else if (event.code === "KeyS") {
      saveSession();
      event.preventDefault();
    }
  }
}
</script>

<style scoped lang="scss">
.run {
  padding: 0 calc((100% - 50rem) / 2);

  .upload-button {
    border-top-right-radius: 0 !important;
    border-bottom-right-radius: 0 !important;
    border-right: 0 !important;
  }
}
</style>
