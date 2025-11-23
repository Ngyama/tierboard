<template>
  <div class="container">
    <div class="header">
      <h1>TierMaker</h1>
    </div>

    <div class="controls">
      <div class="action-buttons">
        <button class="btn btn-primary" @click="exportTierList">导出分级图</button>
        <button class="btn btn-secondary" @click="clearAll">清空所有</button>
        <button class="btn btn-success" @click="openTierManager">管理分级</button>
      </div>
      <div class="file-count">已上传 {{ totalImages }} 张图片</div>
    </div>

    <div class="loading" :class="{ active: processingUpload }">
      <div class="spinner" />
      <p>正在处理图片...</p>
    </div>

    <div class="tier-container" ref="tierContainerRef">
      <div
        v-for="tier in tierConfig"
        :key="tier.id"
        class="tier-row"
        :data-tier="tier.id"
        @dragover.prevent="handleTierRowDragOver($event, tier.id)"
        @dragleave="handleTierRowDragLeave($event)"
        @drop.prevent="handleTierRowDrop($event, tier.id)"
      >
        <div
          class="tier-drag-handle"
          title="拖动调整分级顺序"
          draggable="true"
          @dragstart="handleTierRowDragStart(tier.id, $event)"
          @dragend="handleTierRowDragEnd"
        >
          <div class="drag-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        <div
          class="tier-label"
          :style="{ background: tier.color }"
          @click="startTierNameEdit(tier)"
        >
          <span v-if="editingTierId !== tier.id">{{ tier.name }}</span>
          <input
            v-else
            :ref="setTierNameInputRef"
            v-model="editingTierName"
            maxlength="20"
            @keydown.enter.prevent="confirmTierNameEdit"
            @keydown.esc.prevent="cancelTierNameEdit"
            @blur="confirmTierNameEdit"
          />
        </div>

        <div
          class="tier-content"
          :class="{ 'drag-over': dragOverTier === tier.id }"
          :style="{ background: hexToLightRgba(tier.color, 0.15) }"
          @dragover.prevent="handleTierDragOver($event, tier.id)"
          @dragleave="handleTierDragLeave($event, tier.id)"
          @drop.prevent="handleTierDrop($event, tier.id)"
        >
          <div
            v-for="item in tierData[tier.id]"
            :key="item.id"
            class="tier-item"
            draggable="true"
            :data-id="item.id"
            @dragstart="handleDragStart(item.id, tier.id, $event)"
            @dragend="handleDragEnd"
          >
            <img :src="item.src" :alt="item.name" loading="lazy" />
            <button class="remove-btn" @click.stop="removeItem(tier.id, item.id)">×</button>
          </div>

          <div
            class="add-image-btn"
            :title="`点击添加图片到 ${tier.name} 级`"
            @click="openImageSelector(tier.id)"
          >
            +
          </div>

          <div
            v-if="dragIndicator.visible && dragIndicator.tierId === tier.id"
            class="drag-indicator"
            :style="{ left: `${dragIndicator.left}px` }"
          />
        </div>
      </div>
    </div>

    <div class="unassigned-items">
      <div class="unassigned-title">未分级图片</div>
      <div
        class="unassigned-grid"
        :class="{ 'drag-over': dragOverUnassigned }"
        @dragover.prevent="handleUnassignedDragOver"
        @dragleave="handleUnassignedDragLeave"
        @drop.prevent="handleUnassignedDrop"
      >
        <div
          v-for="item in tierData.unassigned"
          :key="item.id"
          class="tier-item"
          draggable="true"
          :data-id="item.id"
          @dragstart="handleDragStart(item.id, 'unassigned', $event)"
          @dragend="handleDragEnd"
        >
          <img :src="item.src" :alt="item.name" loading="lazy" />
          <button class="remove-btn" @click.stop="removeItem('unassigned', item.id)">×</button>
        </div>

        <div
          class="add-image-btn"
          title="点击上传图片"
          @click="triggerImageUpload"
        >
          +
        </div>

        <div
          v-show="tierData.unassigned.length === 0"
          class="drop-zone"
          :class="{ 'drag-over': dragOverUnassigned }"
        >
          拖拽图片到这里开始分级，或点击 + 号上传图片
        </div>
      </div>
    </div>

    <input
      ref="fileInputRef"
      type="file"
      multiple
      accept="image/*"
      style="display: none"
      @change="handleFileChange"
    />
  </div>

  <div
    v-if="tierManagerVisible"
    class="modal"
    @click.self="closeTierManager"
  >
    <div class="modal-content">
      <div class="modal-header">
        <h2>管理分级</h2>
        <span class="close" @click="closeTierManager">&times;</span>
      </div>
      <div class="modal-body">
        <div class="tier-manager-section">
          <h3>当前分级</h3>
          <div class="tier-list">
            <div
              v-for="tier in tierConfig"
              :key="tier.id"
              class="tier-manager-item"
              :style="{
                background: tier.color ? hexToLightRgba(tier.color, 0.15) : 'rgba(0, 0, 0, 0.15)'
              }"
            >
              <button
                class="tier-color-btn"
                :style="{ background: tier.color }"
                title="点击更换颜色"
                @click="changeTierColor(tier.id)"
              />
              <input
                :value="tier.name"
                maxlength="10"
                @change="event => handleTierManagerNameChange(tier.id, event)"
              />
              <button
                class="delete-btn"
                :disabled="tierConfig.length <= 1"
                @click="deleteTier(tier.id)"
                title="删除此分级"
              >
                <span class="delete-icon">×</span>
              </button>
            </div>
          </div>
          <button class="btn btn-success" @click="addNewTier">+ 添加新分级</button>
        </div>
      </div>
    </div>
  </div>

  <div v-if="sidebarVisible" class="sidebar-mask" @click="closeSidebar" />
  <div class="search-sidebar" :class="{ show: sidebarVisible }">
    <div class="sidebar-header">
      <h2>{{ sidebarTitle }}</h2>
      <span class="close" @click="closeSidebar">&times;</span>
    </div>
    <div class="sidebar-body">
      <div class="media-type-selector">
        <button
          v-for="type in mediaTypes"
          :key="type.value"
          class="media-type-btn"
          :class="{ active: currentMediaType === type.value }"
          @click="switchMediaType(type.value)"
        >
          {{ type.icon }} {{ type.label }}
        </button>
      </div>
      <div class="search-section">
        <input
          ref="searchInputRef"
          class="search-input"
          v-model.trim="searchQuery"
          :placeholder="searchPlaceholder"
          maxlength="100"
          @keyup.enter="searchMedia"
        />
        <button class="search-btn" @click="searchMedia">搜索</button>
      </div>

      <div class="search-results">
        <template v-if="searchState.loading">
          <div class="no-results">🔍 搜索中...</div>
        </template>
        <template v-else-if="searchState.error">
          <div class="no-results">
            ❌ 搜索失败：{{ searchState.error }}<br /><br />
            请检查：<br />
            1. 网络连接<br />
            2. API 配置<br />
            3. 搜索内容
          </div>
        </template>
        <template v-else-if="searchResults.length === 0">
          <div class="no-results">输入关键词后开始搜索</div>
        </template>
        <template v-else>
          <div
            v-for="item in searchResults"
            :key="item.id"
            class="game-result"
            @click="selectSearchItem(item)"
          >
            <img
              :src="item.coverUrl"
              :alt="item.name"
              loading="lazy"
              @error="event => (event.target.src = fallbackCover)"
            />
            <h3>{{ item.name }}</h3>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch, nextTick } from 'vue';
import html2canvas from 'html2canvas';

const STORAGE_KEY = 'tierMakerData';
const STORAGE_VERSION = 2;

const defaultTierConfig = [
  { id: 's', name: 'S', color: '#ffb3d9' },
  { id: 'a', name: 'A', color: '#f0e68c' },
  { id: 'b', name: 'B', color: '#98fb98' },
  { id: 'c', name: 'C', color: '#87ceeb' },
  { id: 'd', name: 'D', color: '#dda0dd' },
  { id: 'f', name: 'F', color: '#ffb6c1' }
];

const colorPalette = [
  '#ffb3d9',
  '#f0e68c',
  '#98fb98',
  '#87ceeb',
  '#dda0dd',
  '#ffb6c1',
  '#ffa07a',
  '#98d8f0'
];

const mediaTypes = [
  { value: 'games', label: '游戏', icon: '🎮' },
  { value: 'anime', label: '动画', icon: '📺' },
  { value: 'books', label: '书籍', icon: '📚' },
  { value: 'music', label: '音乐', icon: '🎵' }
];

const sidebarTitles = {
  games: '搜索游戏',
  books: '搜索书籍',
  anime: '搜索动画',
  music: '搜索音乐'
};

const placeholders = {
  games: '输入游戏名称...',
  books: '输入书籍名称...',
  anime: '输入动画名称...',
  music: '输入音乐名称...'
};

const fallbackCover = 'https://via.placeholder.com/200x120?text=No+Cover';

const tierConfig = ref([]);
const tierData = reactive({ unassigned: [] });

const processingUpload = ref(false);
const tierManagerVisible = ref(false);
const sidebarVisible = ref(false);

const currentSelectedTier = ref('');
const currentMediaType = ref('games');
const searchQuery = ref('');
const searchResults = ref([]);
const searchState = reactive({
  loading: false,
  error: ''
});

const editingTierId = ref('');
const editingTierName = ref('');
const tierNameInputRefs = new Map();

const dragState = reactive({
  itemId: '',
  fromTier: ''
});

const tierRowDragState = reactive({
  draggingTierId: '',
  dragOverTierId: ''
});

const dragIndicator = reactive({
  visible: false,
  tierId: '',
  left: 0
});

const dragOverTier = ref('');
const dragOverUnassigned = ref(false);

const fileInputRef = ref(null);
const tierContainerRef = ref(null);
const searchInputRef = ref(null);

initializeState();

watch(
  tierConfig,
  () => {
    ensureTierBuckets();
    persistState();
  },
  { deep: true }
);

watch(
  tierData,
  () => {
    persistState();
  },
  { deep: true }
);

const totalImages = computed(() =>
  Object.values(tierData).reduce((sum, list) => sum + list.length, 0)
);

const sidebarTitle = computed(() => sidebarTitles[currentMediaType.value]);
const searchPlaceholder = computed(
  () => placeholders[currentMediaType.value]
);

function initializeState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const config =
        Array.isArray(parsed.tierConfig) && parsed.tierConfig.length > 0
          ? parsed.tierConfig
          : deepClone(defaultTierConfig);

      const data = getEmptyTierData(config);
      if (parsed.tierData) {
        Object.keys(parsed.tierData).forEach((key) => {
          const list = Array.isArray(parsed.tierData[key])
            ? [...parsed.tierData[key]]
            : [];
          const normalized =
            parsed.version && parsed.version >= STORAGE_VERSION
              ? list
              : list.reverse();
          data[key] = normalized;
        });
      }

      tierConfig.value = config;
      Object.assign(tierData, data);
      ensureTierBuckets();
      return;
    }
  } catch (error) {
    console.warn('无法从本地存储加载数据', error);
  }

  tierConfig.value = deepClone(defaultTierConfig);
  Object.assign(tierData, getEmptyTierData(tierConfig.value));
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function hexToLightRgba(hex, opacity = 0.15) {
  if (!hex) return `rgba(0, 0, 0, ${opacity})`;
  const colorStr = String(hex).trim();
  let hexValue = colorStr.replace('#', '');
  
  if (hexValue.length !== 6) return `rgba(0, 0, 0, ${opacity})`;
  
  const r = parseInt(hexValue.substring(0, 2), 16);
  const g = parseInt(hexValue.substring(2, 4), 16);
  const b = parseInt(hexValue.substring(4, 6), 16);
  
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(0, 0, 0, ${opacity})`;
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function getTierBackgroundColor(color) {
  return hexToLightRgba(color, 0.15);
}

function getTierItemStyle(tier) {
  return {
    backgroundColor: hexToLightRgba(tier.color, 0.15)
  };
}

function getEmptyTierData(config) {
  const data = { unassigned: [] };
  config.forEach((tier) => {
    data[tier.id] = data[tier.id] || [];
  });
  return data;
}

function ensureTierBuckets() {
  tierConfig.value.forEach((tier) => {
    if (!Array.isArray(tierData[tier.id])) {
      tierData[tier.id] = [];
    }
  });
  if (!Array.isArray(tierData.unassigned)) {
    tierData.unassigned = [];
  }
}

function persistState() {
  try {
    const saveData = {
      version: STORAGE_VERSION,
      tierConfig: tierConfig.value,
      tierData: JSON.parse(JSON.stringify(tierData))
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
  } catch (error) {
    console.warn('无法保存到本地存储', error);
  }
}

function triggerImageUpload() {
  fileInputRef.value?.click();
}

async function handleFileChange(event) {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;
  await processFiles(files);
  event.target.value = '';
}

async function processFiles(files, targetTier = 'unassigned') {
  const imageFiles = files.filter((file) => file.type.startsWith('image/'));
  if (!imageFiles.length) {
    window.alert('请选择图片文件！');
    return;
  }

  processingUpload.value = true;
  for (const file of imageFiles) {
    const dataUrl = await readFileAsDataURL(file);
    const imageData = {
      id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      src: dataUrl,
      name: file.name
    };
    if (!tierData[targetTier]) {
      tierData[targetTier] = [];
    }
    tierData[targetTier].unshift(imageData);
  }
  processingUpload.value = false;
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function handleDragStart(itemId, tierId, event) {
  dragState.itemId = itemId;
  dragState.fromTier = tierId;
  dragOverTier.value = tierId;
  event.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd() {
  dragState.itemId = '';
  dragState.fromTier = '';
  dragIndicator.visible = false;
  dragOverTier.value = '';
  dragOverUnassigned.value = false;
}

function handleTierDragOver(event, tierId) {
  dragOverTier.value = tierId;
  updateDragIndicator(event, tierId);
}

function handleTierDragLeave(event, tierId) {
  if (!event.currentTarget.contains(event.relatedTarget)) {
    dragOverTier.value = dragOverTier.value === tierId ? '' : dragOverTier.value;
    hideDragIndicator();
  }
}

function handleTierDrop(event, tierId) {
  if (!dragState.itemId) return;
  const container = event.currentTarget;
  const insertIndex = calculateInsertIndex(container, event.clientX, tierId);
  moveItem(dragState.itemId, dragState.fromTier, tierId, insertIndex);
  handleDragEnd();
}

function handleUnassignedDragOver(event) {
  dragOverUnassigned.value = true;
  updateDragIndicator(event, 'unassigned');
}

function handleUnassignedDragLeave(event) {
  if (!event.currentTarget.contains(event.relatedTarget)) {
    dragOverUnassigned.value = false;
    hideDragIndicator();
  }
}

function handleUnassignedDrop(event) {
  if (!dragState.itemId) return;
  const container = event.currentTarget;
  const insertIndex = calculateInsertIndex(container, event.clientX, 'unassigned');
  moveItem(dragState.itemId, dragState.fromTier, 'unassigned', insertIndex);
  handleDragEnd();
}

function updateDragIndicator(event, tierId) {
  const container = event.currentTarget;
  const items = Array.from(
    container.querySelectorAll('.tier-item')
  ).filter((el) => el.dataset.id !== dragState.itemId);

  if (!items.length) {
    dragIndicator.visible = false;
    return;
  }

  const { closestItem, insertBefore } = findClosestItem(items, event.clientX);

  const containerRect = container.getBoundingClientRect();
  const targetRect = closestItem.getBoundingClientRect();
  const left = insertBefore ? targetRect.left : targetRect.right;

  dragIndicator.visible = true;
  dragIndicator.tierId = tierId;
  dragIndicator.left = left - containerRect.left;
}

function hideDragIndicator() {
  dragIndicator.visible = false;
  dragIndicator.tierId = '';
}

function findClosestItem(items, mouseX) {
  let closestItem = items[0];
  let minDistance = Infinity;
  items.forEach((item) => {
    const rect = item.getBoundingClientRect();
    const center = rect.left + rect.width / 2;
    const distance = Math.abs(mouseX - center);
    if (distance < minDistance) {
      minDistance = distance;
      closestItem = item;
    }
  });

  const rect = closestItem.getBoundingClientRect();
  const center = rect.left + rect.width / 2;
  const insertBefore = mouseX < center;
  return { closestItem, insertBefore };
}

function calculateInsertIndex(container, mouseX, tierId) {
  const items = Array.from(
    container.querySelectorAll('.tier-item')
  ).filter((el) => el.dataset.id !== dragState.itemId);
  const dataList = tierData[tierId] || [];

  if (!items.length) {
    return 0;
  }

  const { closestItem, insertBefore } = findClosestItem(items, mouseX);
  const targetId = closestItem.dataset.id;
  const targetIndex = dataList.findIndex((item) => item.id === targetId);

  return insertBefore ? targetIndex : targetIndex + 1;
}

function moveItem(itemId, fromTier, toTier, insertIndex = 0) {
  if (!itemId || !fromTier || !toTier) return;
  if (!tierData[fromTier]) return;
  if (!tierData[toTier]) {
    tierData[toTier] = [];
  }

  const fromList = tierData[fromTier];
  const itemIndex = fromList.findIndex((item) => item.id === itemId);
  if (itemIndex === -1) return;
  const [item] = fromList.splice(itemIndex, 1);

  const targetList = tierData[toTier];
  const normalizedIndex = Math.min(Math.max(insertIndex, 0), targetList.length);
  targetList.splice(normalizedIndex, 0, item);
}

function removeItem(tierId, itemId) {
  const list = tierData[tierId];
  if (!list) return;
  const index = list.findIndex((item) => item.id === itemId);
  if (index !== -1) {
    list.splice(index, 1);
  }
}

function handleTierRowDragStart(tierId, event) {
  tierRowDragState.draggingTierId = tierId;
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', tierId);
  // 找到父级 tier-row 并添加拖拽样式
  const tierRow = event.currentTarget.closest('.tier-row');
  if (tierRow) {
    tierRow.classList.add('dragging-tier');
  }
}

function handleTierRowDragOver(event, tierId) {
  if (tierRowDragState.draggingTierId && tierRowDragState.draggingTierId !== tierId) {
    tierRowDragState.dragOverTierId = tierId;
    event.currentTarget.classList.add('drag-over-tier');
  }
}

function handleTierRowDragLeave(event) {
  if (!event.currentTarget.contains(event.relatedTarget)) {
    event.currentTarget.classList.remove('drag-over-tier');
    tierRowDragState.dragOverTierId = '';
  }
}

function handleTierRowDrop(event, targetTierId) {
  event.currentTarget.classList.remove('drag-over-tier');
  if (!tierRowDragState.draggingTierId || tierRowDragState.draggingTierId === targetTierId) {
    return;
  }
  
  const fromIndex = tierConfig.value.findIndex((t) => t.id === tierRowDragState.draggingTierId);
  const toIndex = tierConfig.value.findIndex((t) => t.id === targetTierId);
  
  if (fromIndex === -1 || toIndex === -1) return;
  
  const [movedTier] = tierConfig.value.splice(fromIndex, 1);
  tierConfig.value.splice(toIndex, 0, movedTier);
}

function handleTierRowDragEnd(event) {
  // 移除所有拖拽样式
  document.querySelectorAll('.dragging-tier').forEach((el) => {
    el.classList.remove('dragging-tier');
  });
  document.querySelectorAll('.drag-over-tier').forEach((el) => {
    el.classList.remove('drag-over-tier');
  });
  tierRowDragState.draggingTierId = '';
  tierRowDragState.dragOverTierId = '';
}

function clearAll() {
  if (!window.confirm('确定要清空所有图片吗？')) return;
  Object.keys(tierData).forEach((key) => {
    tierData[key] = [];
  });
}

async function exportTierList() {
  if (!tierContainerRef.value) return;
  
  // 添加导出类来隐藏拖拽手柄和加号按钮
  document.body.classList.add('exporting');
  
  try {
    const canvas = await html2canvas(tierContainerRef.value, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true
    });
    const link = document.createElement('a');
    link.download = 'tier-list.png';
    link.href = canvas.toDataURL();
    link.click();
  } finally {
    // 导出完成后移除类
    document.body.classList.remove('exporting');
  }
}

function openTierManager() {
  tierManagerVisible.value = true;
}

function closeTierManager() {
  tierManagerVisible.value = false;
}

function changeTierColor(tierId) {
  const tier = tierConfig.value.find((item) => item.id === tierId);
  if (!tier) return;
  const currentIndex = colorPalette.indexOf(tier.color);
  const nextIndex = (currentIndex + 1) % colorPalette.length;
  tier.color = colorPalette[nextIndex];
}

function updateTierName(tierId, name) {
  const tier = tierConfig.value.find((item) => item.id === tierId);
  if (!tier) return;
  const value = name.trim();
  if (!value) return;
  tier.name = value;
}

function handleTierManagerNameChange(tierId, event) {
  updateTierName(tierId, event.target.value);
  event.target.value = tierConfig.value.find((tier) => tier.id === tierId)?.name || '';
}

function deleteTier(tierId) {
  if (tierConfig.value.length <= 1) {
    window.alert('至少需要保留一个分级！');
    return;
  }

  if (!window.confirm('确定要删除这个分级吗？该分级中的图片将移动到未分级区域。')) {
    return;
  }

  if (tierData[tierId] && tierData[tierId].length) {
    tierData.unassigned.unshift(...tierData[tierId]);
  }
  delete tierData[tierId];
  tierConfig.value = tierConfig.value.filter((tier) => tier.id !== tierId);
}

function addNewTier() {
  const name = window.prompt('请输入新分级的名称：', '新分级');
  if (!name) return;
  const trimmed = name.trim();
  if (!trimmed) return;

  const newId = `tier_${Date.now()}`;
  const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
  const newTier = {
    id: newId,
    name: trimmed,
    color: color
  };
  tierConfig.value.push(newTier);
  tierData[newId] = [];
  
  // 确保 Vue 正确更新视图
  nextTick(() => {
    ensureTierBuckets();
  });
}

function startTierNameEdit(tier) {
  editingTierId.value = tier.id;
  editingTierName.value = tier.name;
  nextTick(() => {
    const input = tierNameInputRefs.get(tier.id);
    input?.focus();
    input?.select();
  });
}

function setTierNameInputRef(el) {
  if (!editingTierId.value) return;
  if (el) {
    tierNameInputRefs.set(editingTierId.value, el);
  } else {
    tierNameInputRefs.delete(editingTierId.value);
  }
}

function confirmTierNameEdit() {
  if (!editingTierId.value) return;
  const tier = tierConfig.value.find((item) => item.id === editingTierId.value);
  if (tier && editingTierName.value.trim()) {
    tier.name = editingTierName.value.trim();
  }
  cancelTierNameEdit();
}

function cancelTierNameEdit() {
  editingTierId.value = '';
  editingTierName.value = '';
}

function openImageSelector(tierId) {
  currentSelectedTier.value = tierId;
  sidebarVisible.value = true;
  currentMediaType.value = 'games';
  searchQuery.value = '';
  searchResults.value = [];
  searchState.loading = false;
  searchState.error = '';
  nextTick(() => {
    searchInputRef.value?.focus();
  });
}

function closeSidebar() {
  sidebarVisible.value = false;
  currentSelectedTier.value = '';
}

function switchMediaType(type) {
  currentMediaType.value = type;
  searchResults.value = [];
  searchState.loading = false;
  searchState.error = '';
  searchQuery.value = '';
  nextTick(() => {
    searchInputRef.value?.focus();
  });
}

async function searchMedia() {
  if (!searchQuery.value) {
    window.alert('请输入搜索内容');
    return;
  }

  searchState.loading = true;
  searchState.error = '';
  searchResults.value = [];

  try {
    let results = [];
    if (currentMediaType.value === 'games') {
      results = await fetchGames(searchQuery.value);
    } else if (currentMediaType.value === 'books') {
      results = await fetchBooks(searchQuery.value);
    } else if (currentMediaType.value === 'anime') {
      results = await fetchAnime(searchQuery.value);
    } else {
      results = [];
    }
    searchResults.value = results;
  } catch (error) {
    searchState.error = error.message;
  } finally {
    searchState.loading = false;
  }
}

async function fetchGames(query) {
  const response = await fetch('/api/igdb/games', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: `search "${query}"; fields name,cover.url,summary,rating; limit 20;`
    })
  });

  if (!response.ok) {
    throw new Error(`代理服务器请求失败: ${response.status}`);
  }

  const games = await response.json();
  return games
    .filter((game) => game.cover && game.name)
    .map((game) => ({
      id: game.id,
      name: game.name,
      summary: game.summary ? `${game.summary.slice(0, 100)}...` : '暂无描述',
      coverUrl: game.cover?.url
        ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}`
        : fallbackCover
    }));
}

async function fetchBooks(query) {
  const response = await fetch('/api/google/books', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query,
      maxResults: 20
    })
  });

  if (!response.ok) {
    throw new Error(`Google Books API 请求失败: ${response.status}`);
  }

  const books = await response.json();
  return books.map((book) => ({
    id: book.id,
    name: book.title,
    summary: book.description
      ? `${book.description.slice(0, 100)}...`
      : '暂无描述',
    coverUrl: book.cover
      ? book.cover.replace('http://', 'https://')
      : fallbackCover
  }));
}

async function fetchAnime(query) {
  const response = await fetch('/api/bangumi/anime', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query,
      limit: 20
    })
  });

  if (!response.ok) {
    throw new Error(`Bangumi API 请求失败: ${response.status}`);
  }

  const animeList = await response.json();
  return animeList.map((anime) => ({
    id: anime.id,
    name: anime.name,
    summary: anime.summary
      ? `${anime.summary.slice(0, 100)}...`
      : '暂无描述',
    coverUrl: anime.cover
      ? anime.cover.replace('http://', 'https://')
      : fallbackCover
  }));
}

function selectSearchItem(item) {
  if (!currentSelectedTier.value) {
    window.alert('错误：未选择目标等级');
    return;
  }

  const imageData = {
    id: `api_${item.id}_${Date.now()}`,
    src: item.coverUrl.startsWith('http')
      ? item.coverUrl
      : `https:${item.coverUrl}`,
    name: item.name
  };

  tierData[currentSelectedTier.value].unshift(imageData);
  window.alert(`成功添加 "${item.name}" 到 ${currentSelectedTier.value.toUpperCase()} 级！`);
  closeSidebar();
}
</script>

