<script setup lang="ts">
import { ref, toRaw } from 'vue'

const fileList = ref<{ name: string; path: string }[][]>([])
const getFiles = async () => {
  const fl = await window.electron.ipcRenderer.invoke('dialog:openFile')

  console.log(fl)

  fileList.value = fl
}
const combine = async () => {
  const r = await window.electron.ipcRenderer.invoke('startCombine', toRaw(fileList.value))

  console.log(r)
}
const cancel = () => {
  fileList.value = []
}
</script>

<template>
  <div class="actions">
    <div v-show="fileList.length === 0" class="action" @click="getFiles">选择目录</div>
    <div v-show="fileList.length > 0" class="action" @click="combine">合并</div>
    <div v-show="fileList.length > 0" class="action" @click="cancel">取消</div>
  </div>
  <div v-show="fileList.length > 0" class="file-list-wrapper">
    <div v-for="(group, index) in fileList" :key="index" class="file-group-wrapper">
      <div v-for="(file, fi) in group" :key="fi" class="file">{{ file.name }}</div>
    </div>
  </div>
</template>

<style>
.actions {
  display: flex;
  padding-top: 32px;
  margin: -6px;
  flex-wrap: wrap;
  justify-content: flex-start;
}

.action {
  flex-shrink: 0;
  padding: 6px;
}

.action {
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  border: 1px solid transparent;
  text-align: center;
  font-weight: 600;
  white-space: nowrap;
  border-radius: 20px;
  padding: 0 20px;
  line-height: 38px;
  font-size: 14px;
  border-color: var(--ev-button-alt-border);
  color: var(--ev-button-alt-text);
  background-color: var(--ev-button-alt-bg);
}

.action + .action {
  margin-left: 10px;
}

.action:hover {
  border-color: var(--ev-button-alt-hover-border);
  color: var(--ev-button-alt-hover-text);
  background-color: var(--ev-button-alt-hover-bg);
}
.file-list-wrapper {
  width: 70%;
  margin-top: 20px;
  padding: 10px;
}
.file-group-wrapper {
  padding: 6px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.file {
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}
</style>
