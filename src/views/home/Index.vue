<template>
  <div class="home h-full flex flex-col">
    <h1 class="text-white text-center mb-4">历史会话</h1>
    <div class="h-0 flex-1 flex flex-col items-center none-scrollbar">
      <div
        v-for="item in list"
        :key="item.id"
        class="item w-80 max-w-full m-2 p-2 bg-black text-white hover:opacity-80 rounded-lg cursor-pointer flex"
        @click="jumpRun(item)"
      >
        <div class="w-6 flex items-center">
          <el-icon><ChatDotSquare /></el-icon>
        </div>
        <div class="info w-0 flex-1">
          <template v-if="!item.edit">
            <div class="truncate">{{ item.title }}</div>
            <div class="text-xs text-zinc-300 truncate">
              {{ item.dateTime }}
            </div>
          </template>
          <el-input
            v-else
            class="my-1"
            v-model="item.title"
            id="input"
            @keydown.enter="item.edit = false"
            @blur="updateItem(item)"
            @click.stop
          />
        </div>
        <div
          class="operate w-0 flex items-center justify-between overflow-hidden"
          v-if="!item.edit"
        >
          <el-icon @click.stop="openEdit(item.id)"><Edit /></el-icon>
          <el-icon @click.stop="deleteItem(item.id)"><Delete /></el-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, onBeforeMount, nextTick } from "vue";
import { useRouter } from "vue-router";
import { ChatDotSquare, Edit, Delete } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";

const list = reactive([]);

const $router = new useRouter();

let title;

/** 跳转页面 */
function jumpRun(item) {
  $router.push({
    path: "/run",
    query: {
      id: item.id,
    },
  });
}

onBeforeMount(() => {
  const data = localStorage.getItem("data");
  if (data && Array.isArray(JSON.parse(data))) {
    list.push(...JSON.parse(data));
  }
  list.forEach((v) => (v.edit = false));
  list.sort((a, b) => b.dateTime.localeCompare(a.dateTime));
});

/** 删除会话记录 */
function deleteItem(id) {
  ElMessageBox.confirm("删除后相关数据将无法恢复，是否继续?", "删除提示", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      list.splice(
        list.findIndex((v) => v.id === id),
        1
      );
      localStorage.setItem("data", JSON.stringify(list));
      ElMessage({
        type: "success",
        message: "删除成功",
        grouping: true,
        showClose: true,
      });
    })
    .catch(() => {});
}

/** 编辑 */
function openEdit(id) {
  list.forEach((v) => {
    v.edit = v.id === id;
  });
  nextTick(() => {
    const input = document.getElementById("input");
    title = input.value;
    input.focus();
  });
}

/** 更新会话记录 */
function updateItem(item) {
  item.edit = false;
  if (!item.title || item.title === title) {
    item.title = title;
    return;
  }
  localStorage.setItem("data", JSON.stringify(list));
  ElMessage({
    type: "success",
    message: "更新成功",
    grouping: true,
    showClose: true,
  });
}
</script>

<style scoped lang="scss">
.home {
  .item {
    .operate {
      .el-icon {
        padding: 0.25rem;
        box-sizing: content-box;
        border-radius: 50%;
      }

      .el-icon:hover {
        background-color: rgb(30 41 59);
      }
    }
  }

  .item:hover {
    .operate {
      width: 3rem;
      transition: width 0.5s;
    }
  }
}
</style>
