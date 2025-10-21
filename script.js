// 全局变量
let imageCounter = 0;

// 分级配置
let tierConfig = [
    { id: 's', name: 'S', color: '#ffb3d9' },
    { id: 'a', name: 'A', color: '#f0e68c' },
    { id: 'b', name: 'B', color: '#98fb98' },
    { id: 'c', name: 'C', color: '#87ceeb' },
    { id: 'd', name: 'D', color: '#dda0dd' },
    { id: 'f', name: 'F', color: '#ffb6c1' }
];

// 分级数据
let tierData = {
    unassigned: []
};

// 初始化分级数据
function initializeTierData() {
    tierConfig.forEach(tier => {
        if (!tierData[tier.id]) {
            tierData[tier.id] = [];
        }
    });
}

// 页面加载时恢复数据
document.addEventListener('DOMContentLoaded', function() {
    initializeTierData();
    loadFromLocalStorage();
    setupEventListeners();
    // 确保在数据加载后再渲染分级行
    renderTierRows();
});

// 渲染分级行
function renderTierRows() {
    const container = document.getElementById('tierContainer');
    if (!container) {
        console.warn('tierContainer not found');
        return;
    }
    
    container.innerHTML = '';
    
    tierConfig.forEach(tier => {
        const tierRow = document.createElement('div');
        tierRow.className = 'tier-row';
        tierRow.dataset.tier = tier.id;
        
        tierRow.innerHTML = `
            <div class="tier-label" style="background: ${tier.color};" onclick="editTierName('${tier.id}')" title="点击编辑分级名称">
                <span class="tier-name">${tier.name}</span>
            </div>
            <div class="tier-content" ondrop="drop(event)" ondragover="allowDrop(event)" ondragleave="handleTierDragLeave(event)">
                <div class="add-image-btn" onclick="openImageSelector('${tier.id}')" title="点击添加图片到${tier.name}级">+</div>
            </div>
        `;
        
        container.appendChild(tierRow);
    });
}

// 设置事件监听器
function setupEventListeners() {
    const fileInput = document.getElementById('fileInput');
    fileInput.addEventListener('change', handleFileUpload);
    
    // 拖拽上传
    const dropZone = document.querySelector('.unassigned-grid');
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('drop', handleFileDrop);
    dropZone.addEventListener('dragenter', handleDragEnter);
    dropZone.addEventListener('dragleave', handleDragLeave);
    
    // 侧边栏点击外部关闭
    const sidebar = document.getElementById('gameSearchSidebar');
    sidebar.addEventListener('click', function(event) {
        if (event.target === sidebar) {
            closeGameSearchModal();
        }
    });
    
    // 模态框点击外部关闭
    const modal = document.getElementById('tierManagerModal');
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeTierManager();
        }
    });
}

// 处理文件上传
function handleFileUpload(event) {
    const files = Array.from(event.target.files);
    processFiles(files);
}

// 处理拖拽上传
function handleFileDrop(event) {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    processFiles(files);
}

function handleDragOver(event) {
    event.preventDefault();
}

function handleDragEnter(event) {
    event.preventDefault();
    event.currentTarget.classList.add('drag-over');
}

function handleDragLeave(event) {
    event.currentTarget.classList.remove('drag-over');
}

// 处理文件
function processFiles(files) {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
        alert('请选择图片文件！');
        return;
    }

    showLoading(true);
    
    imageFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageData = {
                id: 'img_' + Date.now() + '_' + index,
                src: e.target.result,
                name: file.name
            };
            
            tierData.unassigned.push(imageData);
            createTierItem(imageData, 'unassigned');
            
            // 隐藏drop-zone，显示虚拟按钮
            const unassignedGrid = document.getElementById('unassignedGrid');
            const dropZone = unassignedGrid.querySelector('.drop-zone');
            if (dropZone) {
                dropZone.style.display = 'none';
            }
            
            if (index === imageFiles.length - 1) {
                showLoading(false);
                updateFileCount();
                saveToLocalStorage();
            }
        };
        reader.readAsDataURL(file);
    });
}

// 创建分级项目
function createTierItem(imageData, tier) {
    const item = document.createElement('div');
    item.className = 'tier-item';
    item.draggable = true;
    item.dataset.id = imageData.id;
    item.dataset.tier = tier;
    
    item.innerHTML = `
        <img src="${imageData.src}" alt="${imageData.name}" draggable="false">
        <button class="remove-btn" onclick="removeItem('${imageData.id}')">×</button>
    `;
    
    // 确保拖拽事件正确绑定
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragend', handleDragEnd);
    
    // 防止图片本身被拖拽
    const img = item.querySelector('img');
    img.addEventListener('dragstart', function(e) {
        e.preventDefault();
    });
    
    if (tier === 'unassigned') {
        const unassignedGrid = document.getElementById('unassignedGrid');
        const dropZone = unassignedGrid.querySelector('.drop-zone');
        if (dropZone) {
            dropZone.remove();
        }
        unassignedGrid.appendChild(item);
    } else {
        const tierContent = document.querySelector(`[data-tier="${tier}"] .tier-content`);
        // 新图片添加到最前面，虚拟按钮保持在最后
        const addBtn = tierContent.querySelector('.add-image-btn');
        if (addBtn) {
            // 将新图片插入到虚拟按钮之前
            tierContent.insertBefore(item, addBtn);
        } else {
            tierContent.appendChild(item);
        }
    }
}

// 拖拽开始
function handleDragStart(event) {
    event.dataTransfer.setData('text/plain', event.target.dataset.id);
    event.target.classList.add('dragging');
    console.log('拖拽开始:', event.target.dataset.id); // 调试用
}

// 拖拽结束
function handleDragEnd(event) {
    event.target.classList.remove('dragging');
}

// 允许放置
function allowDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.add('drag-over');
    
    // 显示插入位置指示器
    showDragIndicator(event);
}

// 拖拽离开
function handleTierDragLeave(event) {
    event.currentTarget.classList.remove('drag-over');
    hideDragIndicator();
}

// 放置
function drop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
    hideDragIndicator();
    
    const itemId = event.dataTransfer.getData('text/plain');
    const item = document.querySelector(`[data-id="${itemId}"]`);
    
    console.log('放置事件:', itemId, item); // 调试用
    
    if (!item) {
        console.log('未找到拖拽项目'); // 调试用
        return;
    }
    
    const targetTier = event.currentTarget.closest('[data-tier]')?.dataset.tier || 'unassigned';
    const currentTier = item.dataset.tier;
    
    console.log('从', currentTier, '移动到', targetTier); // 调试用
    
    // 更新数据结构
    moveItemToTier(itemId, currentTier, targetTier);
    
    // 更新DOM
    if (targetTier === 'unassigned') {
        const unassignedGrid = document.getElementById('unassignedGrid');
        const dropZone = unassignedGrid.querySelector('.drop-zone');
        if (dropZone) {
            dropZone.remove();
        }
        unassignedGrid.appendChild(item);
    } else {
        // 智能插入：检测鼠标位置来决定插入位置
        const insertPosition = getInsertPosition(event, event.currentTarget, item);
        const addBtn = event.currentTarget.querySelector('.add-image-btn');
        
        if (insertPosition && insertPosition !== addBtn) {
            event.currentTarget.insertBefore(item, insertPosition);
        } else if (addBtn) {
            event.currentTarget.insertBefore(item, addBtn);
        } else {
            event.currentTarget.appendChild(item);
        }
    }
    
    item.dataset.tier = targetTier;
    saveToLocalStorage();
}

// 显示拖拽指示器
function showDragIndicator(event) {
    const container = event.currentTarget;
    const mouseX = event.clientX;
    const items = Array.from(container.children).filter(child => 
        child.classList.contains('tier-item')
    );
    
    if (items.length === 0) {
        hideDragIndicator();
        return;
    }
    
    // 找到最接近鼠标位置的元素
    let closestItem = null;
    let minDistance = Infinity;
    
    items.forEach(item => {
        const itemRect = item.getBoundingClientRect();
        const itemCenterX = itemRect.left + itemRect.width / 2;
        const distance = Math.abs(mouseX - itemCenterX);
        
        if (distance < minDistance) {
            minDistance = distance;
            closestItem = item;
        }
    });
    
    if (closestItem) {
        const itemRect = closestItem.getBoundingClientRect();
        const itemCenterX = itemRect.left + itemRect.width / 2;
        
        // 创建或更新指示器
        let indicator = container.querySelector('.drag-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'drag-indicator';
            container.appendChild(indicator);
        }
        
        // 设置指示器位置
        if (mouseX < itemCenterX) {
            // 插入到元素之前
            indicator.style.left = (itemRect.left - container.getBoundingClientRect().left - 1.5) + 'px';
        } else {
            // 插入到元素之后
            indicator.style.left = (itemRect.right - container.getBoundingClientRect().left - 1.5) + 'px';
        }
        
        indicator.classList.add('show');
    }
}

// 隐藏拖拽指示器
function hideDragIndicator() {
    document.querySelectorAll('.drag-indicator').forEach(indicator => {
        indicator.classList.remove('show');
    });
}

// 获取插入位置
function getInsertPosition(dropEvent, container, draggedItem) {
    const mouseX = dropEvent.clientX;
    const containerRect = container.getBoundingClientRect();
    const items = Array.from(container.children).filter(child => 
        child.classList.contains('tier-item') && child !== draggedItem
    );
    
    if (items.length === 0) {
        return null;
    }
    
    // 找到最接近鼠标位置的元素
    let closestItem = null;
    let minDistance = Infinity;
    
    items.forEach(item => {
        const itemRect = item.getBoundingClientRect();
        const itemCenterX = itemRect.left + itemRect.width / 2;
        const distance = Math.abs(mouseX - itemCenterX);
        
        if (distance < minDistance) {
            minDistance = distance;
            closestItem = item;
        }
    });
    
    if (closestItem) {
        const itemRect = closestItem.getBoundingClientRect();
        const itemCenterX = itemRect.left + itemRect.width / 2;
        
        // 如果鼠标在元素中轴线的左侧，插入到该元素之前
        // 如果鼠标在元素中轴线的右侧，插入到该元素之后
        return mouseX < itemCenterX ? closestItem : closestItem.nextSibling;
    }
    
    return null;
}

// 移动项目到指定等级
function moveItemToTier(itemId, fromTier, toTier) {
    const itemIndex = tierData[fromTier].findIndex(item => item.id === itemId);
    if (itemIndex === -1) return;
    
    const item = tierData[fromTier].splice(itemIndex, 1)[0];
    tierData[toTier].push(item);
}

// 移除项目
function removeItem(itemId) {
    const item = document.querySelector(`[data-id="${itemId}"]`);
    const tier = item.dataset.tier;
    
    // 从数据结构中移除
    const itemIndex = tierData[tier].findIndex(item => item.id === itemId);
    if (itemIndex !== -1) {
        tierData[tier].splice(itemIndex, 1);
    }
    
    // 从DOM中移除
    item.remove();
    
    // 如果未分级区域为空，显示提示
    if (tier === 'unassigned' && tierData.unassigned.length === 0) {
        const unassignedGrid = document.getElementById('unassignedGrid');
        unassignedGrid.innerHTML = `
            <div class="add-image-btn" onclick="openImageUpload()" title="点击上传图片">+</div>
            <div class="drop-zone">拖拽图片到这里开始分级，或点击+号上传图片</div>
        `;
    }
    
    updateFileCount();
    saveToLocalStorage();
}

// 更新文件计数
function updateFileCount() {
    const totalImages = Object.values(tierData).reduce((sum, arr) => sum + arr.length, 0);
    document.getElementById('fileCount').textContent = `已上传 ${totalImages} 张图片`;
}

// 显示/隐藏加载状态
function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}

// 打开图片上传
function openImageUpload() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.accept = 'image/*';
    
    fileInput.onchange = function(event) {
        const files = Array.from(event.target.files);
        if (files.length > 0) {
            processFiles(files);
        }
    };
    
    fileInput.click();
}

// 编辑分级名称
function editTierName(tierId) {
    const tier = tierConfig.find(t => t.id === tierId);
    if (!tier) return;
    
    const newName = prompt('请输入新的分级名称:', tier.name);
    if (newName && newName.trim() && newName !== tier.name) {
        tier.name = newName.trim();
        renderTierRows();
        renderTierData();
        saveToLocalStorage();
    }
}

// 打开分级管理器
function openTierManager() {
    const modal = document.getElementById('tierManagerModal');
    modal.style.display = 'block';
    renderTierManager();
}

// 关闭分级管理器
function closeTierManager() {
    document.getElementById('tierManagerModal').style.display = 'none';
}

// 渲染分级管理器
function renderTierManager() {
    const tierList = document.getElementById('tierList');
    tierList.innerHTML = '';
    
    tierConfig.forEach(tier => {
        const item = document.createElement('div');
        item.className = 'tier-manager-item';
        
        item.innerHTML = `
            <div class="tier-color" style="background: ${tier.color};" onclick="changeTierColor('${tier.id}')" title="点击更改颜色"></div>
            <input type="text" value="${tier.name}" onchange="updateTierName('${tier.id}', this.value)" maxlength="10">
            <button class="delete-btn" onclick="deleteTier('${tier.id}')" ${tierConfig.length <= 1 ? 'disabled' : ''}>删除</button>
        `;
        
        tierList.appendChild(item);
    });
}

// 更新分级名称
function updateTierName(tierId, newName) {
    const tier = tierConfig.find(t => t.id === tierId);
    if (tier && newName.trim()) {
        tier.name = newName.trim();
        renderTierRows();
        renderTierData();
        saveToLocalStorage();
    }
}

// 更改分级颜色
function changeTierColor(tierId) {
    const colors = ['#ffb3d9', '#f0e68c', '#98fb98', '#87ceeb', '#dda0dd', '#ffb6c1', '#ffa07a', '#98d8f0', '#f0e68c', '#dda0dd'];
    const tier = tierConfig.find(t => t.id === tierId);
    if (tier) {
        const currentIndex = colors.indexOf(tier.color);
        const nextIndex = (currentIndex + 1) % colors.length;
        tier.color = colors[nextIndex];
        renderTierRows();
        renderTierData();
        renderTierManager();
        saveToLocalStorage();
    }
}

// 删除分级
function deleteTier(tierId) {
    if (tierConfig.length <= 1) {
        alert('至少需要保留一个分级！');
        return;
    }
    
    if (confirm('确定要删除这个分级吗？分级中的图片将移动到未分级区域。')) {
        // 将分级中的图片移动到未分级区域
        if (tierData[tierId] && tierData[tierId].length > 0) {
            tierData.unassigned = tierData.unassigned.concat(tierData[tierId]);
        }
        
        // 删除分级配置
        tierConfig = tierConfig.filter(t => t.id !== tierId);
        delete tierData[tierId];
        
        // 重新渲染
        renderTierRows();
        renderTierData();
        renderTierManager();
        saveToLocalStorage();
    }
}

// 添加新分级
function addNewTier() {
    const newName = prompt('请输入新分级的名称:', '新分级');
    if (newName && newName.trim()) {
        const newId = 'tier_' + Date.now();
        const colors = ['#ffb3d9', '#f0e68c', '#98fb98', '#87ceeb', '#dda0dd', '#ffb6c1', '#ffa07a', '#98d8f0'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        tierConfig.push({
            id: newId,
            name: newName.trim(),
            color: randomColor
        });
        
        tierData[newId] = [];
        
        renderTierRows();
        renderTierData();
        renderTierManager();
        saveToLocalStorage();
    }
}

// 清空所有
function clearAll() {
    if (confirm('确定要清空所有图片吗？')) {
        // 清空所有分级的数据
        tierData = { unassigned: [] };
        tierConfig.forEach(tier => {
            tierData[tier.id] = [];
        });
        
        // 清空DOM，但保留虚拟按钮
        document.querySelectorAll('.tier-content').forEach(content => {
            const items = content.querySelectorAll('.tier-item');
            items.forEach(item => item.remove());
        });
        
        const unassignedGrid = document.getElementById('unassignedGrid');
        unassignedGrid.innerHTML = `
            <div class="add-image-btn" onclick="openImageUpload()" title="点击上传图片">+</div>
            <div class="drop-zone">拖拽图片到这里开始分级，或点击+号上传图片</div>
        `;
        
        // 确保虚拟按钮存在
        setTimeout(checkVirtualButtons, 50);
        
        updateFileCount();
        saveToLocalStorage();
    }
}

// 导出分级图
function exportTierList() {
    // 使用html2canvas库导出图片
    if (typeof html2canvas === 'undefined') {
        // 动态加载html2canvas
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.onload = () => exportTierList();
        document.head.appendChild(script);
        return;
    }
    
    const container = document.querySelector('.tier-container');
    html2canvas(container, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'tier-list.png';
        link.href = canvas.toDataURL();
        link.click();
    });
}

// 保存到本地存储
function saveToLocalStorage() {
    try {
        const saveData = {
            tierConfig: tierConfig,
            tierData: tierData
        };
        localStorage.setItem('tierMakerData', JSON.stringify(saveData));
    } catch (e) {
        console.warn('无法保存到本地存储:', e);
    }
}

// 从本地存储加载
function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('tierMakerData');
        if (saved) {
            const saveData = JSON.parse(saved);
            
            // 兼容旧版本数据
            if (saveData.tierConfig) {
                tierConfig = saveData.tierConfig;
            }
            if (saveData.tierData) {
                tierData = saveData.tierData;
            } else {
                // 旧版本数据格式
                tierData = saveData;
            }
            
            // 确保所有分级都有数据
            tierConfig.forEach(tier => {
                if (!tierData[tier.id]) {
                    tierData[tier.id] = [];
                }
            });
            
            renderTierData();
            updateFileCount();
            // 数据加载完成后重新渲染分级行
            renderTierRows();
        } else {
            // 如果没有保存的数据，确保默认分级配置正确显示
            renderTierRows();
        }
    } catch (e) {
        console.warn('无法从本地存储加载数据:', e);
        // 出错时也要确保分级行显示
        renderTierRows();
    }
}

// 渲染分级数据
function renderTierData() {
    // 清空现有内容，但保留虚拟按钮
    document.querySelectorAll('.tier-content').forEach(content => {
        // 只移除图片项目，保留虚拟按钮
        const items = content.querySelectorAll('.tier-item');
        items.forEach(item => item.remove());
    });
    
    const unassignedGrid = document.getElementById('unassignedGrid');
    unassignedGrid.innerHTML = '';
    
    // 渲染各个等级 - 按时间顺序渲染，最新的在前面
    Object.keys(tierData).forEach(tier => {
        if (tierData[tier] && tierData[tier].length > 0) {
            // 反转数组，让最新的图片在前面
            const reversedData = [...tierData[tier]].reverse();
            reversedData.forEach(imageData => {
                createTierItem(imageData, tier);
            });
        }
    });
    
    // 如果未分级区域为空，显示提示
    if (tierData.unassigned.length === 0) {
        unassignedGrid.innerHTML = `
            <div class="add-image-btn" onclick="openImageUpload()" title="点击上传图片">+</div>
            <div class="drop-zone">拖拽图片到这里开始分级，或点击+号上传图片</div>
        `;
    } else {
        // 如果有图片，隐藏drop-zone
        const dropZone = unassignedGrid.querySelector('.drop-zone');
        if (dropZone) {
            dropZone.style.display = 'none';
        }
    }
    
    // 确保虚拟按钮存在
    setTimeout(checkVirtualButtons, 50);
}

// 全局变量存储当前选择的等级
let currentSelectedTier = '';

// 全局变量存储当前选择的媒体类型
let currentMediaType = 'games';

// 打开图片选择器
function openImageSelector(tier) {
    console.log('打开游戏选择器，目标等级:', tier);
    
    // 直接使用IGDB API搜索游戏
    currentSelectedTier = tier;
    openGameSearchModal();
}

// 打开游戏搜索侧边栏
function openGameSearchModal() {
    console.log('openGameSearchModal 被调用');
    const sidebar = document.getElementById('gameSearchSidebar');
    const searchInput = document.getElementById('searchInput');
    
    console.log('侧边栏元素:', sidebar);
    console.log('搜索输入框:', searchInput);
    
    sidebar.style.display = 'flex';
    searchInput.focus();
    
    // 重置为游戏类型
    currentMediaType = 'games';
    updateMediaTypeUI();
    
    // 清空之前的结果
    document.getElementById('searchResults').innerHTML = '';
    
    // 添加回车键搜索功能
    searchInput.onkeypress = function(e) {
        if (e.key === 'Enter') {
            console.log('回车键被按下，开始搜索');
            searchMedia();
        }
    };
}


// 关闭游戏搜索侧边栏
function closeGameSearchModal() {
    document.getElementById('gameSearchSidebar').style.display = 'none';
    currentSelectedTier = '';
}

// 切换媒体类型
function switchMediaType(type) {
    currentMediaType = type;
    updateMediaTypeUI();
    
    // 清空搜索结果
    document.getElementById('searchResults').innerHTML = '';
    
    // 更新搜索框占位符
    const searchInput = document.getElementById('searchInput');
    const placeholders = {
        'games': '输入游戏名称...',
        'anime': '输入动画名称...',
        'books': '输入书籍名称...',
        'music': '输入音乐名称...'
    };
    searchInput.placeholder = placeholders[type] || '输入名称...';
}

// 更新媒体类型UI
function updateMediaTypeUI() {
    // 更新按钮状态
    document.querySelectorAll('.media-type-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.type === currentMediaType) {
            btn.classList.add('active');
        }
    });
    
    // 更新标题
    const titles = {
        'games': '搜索游戏',
        'anime': '搜索动画',
        'books': '搜索书籍',
        'music': '搜索音乐'
    };
    document.getElementById('sidebarTitle').textContent = titles[currentMediaType] || '搜索';
}

// 搜索媒体内容
async function searchMedia() {
    console.log('searchMedia 函数被调用，媒体类型:', currentMediaType);
    const searchInput = document.getElementById('searchInput');
    const searchQuery = searchInput.value.trim();
    const resultsContainer = document.getElementById('searchResults');
    
    console.log('搜索查询:', searchQuery);
    
    if (!searchQuery) {
        alert('请输入搜索内容');
        return;
    }
    
    // 显示加载状态
    resultsContainer.innerHTML = '<div class="no-results">🔍 搜索中...</div>';
    console.log('开始搜索:', searchQuery, '类型:', currentMediaType);
    
    try {
        let results;
        
        // 根据媒体类型调用不同的API
        switch (currentMediaType) {
            case 'games':
                results = await fetchGamesFromIGDBAPI(searchQuery);
                break;
            case 'anime':
                // TODO: 实现动画API
                results = await fetchAnimeFromAPI(searchQuery);
                break;
            case 'books':
                // TODO: 实现书籍API
                results = await fetchBooksFromAPI(searchQuery);
                break;
            case 'music':
                // TODO: 实现音乐API
                results = await fetchMusicFromAPI(searchQuery);
                break;
            default:
                throw new Error('未知的媒体类型');
        }
        
        console.log('搜索完成，准备显示结果');
        displaySearchResults(results);
    } catch (error) {
        console.error('搜索失败:', error);
        console.error('错误详情:', error.message);
        resultsContainer.innerHTML = `<div class="no-results">❌ 搜索失败: ${error.message}<br><br>请检查：<br>1. 网络连接<br>2. API配置<br>3. 搜索内容</div>`;
    }
}

// 占位符函数 - 等待API实现
async function fetchAnimeFromAPI(searchQuery) {
    // TODO: 实现动画搜索API
    return [];
}

async function fetchBooksFromAPI(searchQuery) {
    try {
        const response = await fetch('/api/google/books', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: searchQuery,
                maxResults: 20
            })
        });
        
        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }
        
        const books = await response.json();
        return books.map(book => ({
            id: book.id,
            name: book.title,
            summary: book.description || '暂无描述',
            cover: book.cover ? {
                url: book.cover.replace('http://', 'https://')
            } : null,
            authors: book.authors,
            publishedDate: book.publishedDate,
            rating: book.averageRating
        }));
    } catch (error) {
        console.error('Google Books API错误:', error);
        throw new Error(`搜索书籍失败: ${error.message}`);
    }
}

async function fetchMusicFromAPI(searchQuery) {
    // TODO: 实现音乐搜索API
    return [];
}



// 从IGDB API获取游戏数据（通过代理服务器）
async function fetchGamesFromIGDBAPI(searchQuery) {
    try {
        // 首先尝试使用代理服务器
        const response = await fetch('/api/igdb/games', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: `search "${searchQuery}"; fields name,cover.url,summary,rating; limit 20;`
            })
        });
        
        if (!response.ok) {
            throw new Error(`代理服务器请求失败: ${response.status} ${response.statusText}`);
        }
        
        const games = await response.json();
        console.log('API返回的游戏数据:', games);
        console.log('过滤前的游戏数量:', games.length);
        
        // 检查第一个游戏的数据结构
        if (games.length > 0) {
            console.log('第一个游戏的数据结构:', games[0]);
            console.log('第一个游戏的所有字段:', Object.keys(games[0]));
            console.log('第一个游戏的cover字段:', games[0].cover);
            console.log('第一个游戏的name字段:', games[0].name);
            console.log('第一个游戏的summary字段:', games[0].summary);
            console.log('第一个游戏的rating字段:', games[0].rating);
        }
        
        const filteredGames = games.filter(game => game.cover && game.name);
        console.log('过滤后的游戏数量:', filteredGames.length);
        console.log('过滤后的游戏:', filteredGames);
        
        return filteredGames;
        
    } catch (error) {
        // 如果代理服务器不可用，提供备用方案
        if (error.message.includes('Failed to fetch')) {
            throw new Error('无法连接到代理服务器！\n\n请启动代理服务器：\n1. 运行: npm install\n2. 运行: npm start\n3. 访问: http://localhost:3000');
        }
        throw error;
    }
}

// 显示搜索结果
function displaySearchResults(items) {
    const resultsContainer = document.getElementById('searchResults');
    
    console.log('displaySearchResults 被调用，项目数量:', items.length);
    console.log('项目数据:', items);
    
    if (items.length === 0) {
        const noResultsText = {
            'games': '😔 未找到相关游戏',
            'books': '😔 未找到相关书籍',
            'anime': '😔 未找到相关动画',
            'music': '😔 未找到相关音乐'
        };
        resultsContainer.innerHTML = `<div class="no-results">${noResultsText[currentMediaType] || '😔 未找到相关内容'}</div>`;
        return;
    }
    
    try {
        resultsContainer.innerHTML = items.map(item => {
            let coverUrl, title, description;
            
            if (currentMediaType === 'books') {
                // 书籍显示
                coverUrl = item.cover && item.cover.url 
                    ? item.cover.url 
                    : 'https://via.placeholder.com/200x120?text=No+Cover';
                title = item.name;
                description = item.summary ? item.summary.substring(0, 100) + '...' : '暂无描述';
            } else {
                // 游戏显示（默认）
                coverUrl = item.cover && item.cover.url 
                    ? `https:${item.cover.url.replace('t_thumb', 't_cover_big')}` 
                    : 'https://via.placeholder.com/200x120?text=No+Cover';
                title = item.name;
                description = item.summary ? item.summary.substring(0, 100) + '...' : '暂无描述';
            }
            
            return `
                <div class="game-result" onclick="selectGame('${item.id}', '${title.replace(/'/g, "\\'")}', '${coverUrl}')">
                    <img src="${coverUrl}" alt="${title}" loading="lazy" onerror="this.src='https://via.placeholder.com/200x120?text=No+Cover'">
                    <h3>${title}</h3>
                    <p>${description}</p>
                </div>
            `;
        }).join('');
        console.log('搜索结果已显示');
    } catch (error) {
        console.error('显示搜索结果时出错:', error);
        resultsContainer.innerHTML = '<div class="no-results">❌ 显示结果时出错</div>';
    }
}

// 选择游戏并添加到指定等级
function selectGame(gameId, gameName, coverUrl) {
    if (!currentSelectedTier) {
        alert('错误：未选择目标等级');
        return;
    }
    
    // 确保封面URL是完整的HTTPS URL
    const fullCoverUrl = coverUrl.startsWith('http') ? coverUrl : `https:${coverUrl}`;
    
    const imageData = {
        id: 'igdb_' + gameId + '_' + Date.now(),
        src: fullCoverUrl,
        name: gameName,
        summary: '',
        rating: 0
    };
    
    tierData[currentSelectedTier].push(imageData);
    createTierItem(imageData, currentSelectedTier);
    updateFileCount();
    saveToLocalStorage();
    
    // 关闭模态框
    closeGameSearchModal();
    
    alert(`成功添加 "${gameName}" 到 ${currentSelectedTier.toUpperCase()} 级！`);
}

// 处理文件到指定等级
function processFilesToTier(files, targetTier) {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
        alert('请选择图片文件！');
        return;
    }

    showLoading(true);
    
    imageFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageData = {
                id: 'img_' + Date.now() + '_' + index,
                src: e.target.result,
                name: file.name
            };
            
            // 直接添加到指定等级
            tierData[targetTier].push(imageData);
            createTierItem(imageData, targetTier);
            
            if (index === imageFiles.length - 1) {
                showLoading(false);
                updateFileCount();
                saveToLocalStorage();
            }
        };
        reader.readAsDataURL(file);
    });
}


// 检查虚拟按钮是否存在
function checkVirtualButtons() {
    const tiers = ['s', 'a', 'b', 'c', 'd', 'f'];
    tiers.forEach(tier => {
        const tierContent = document.querySelector(`[data-tier="${tier}"] .tier-content`);
        const addBtn = tierContent.querySelector('.add-image-btn');
        console.log(`${tier.toUpperCase()}级虚拟按钮:`, addBtn ? '存在' : '不存在');
        if (!addBtn) {
            console.log('重新创建虚拟按钮...');
            const newBtn = document.createElement('div');
            newBtn.className = 'add-image-btn';
            newBtn.onclick = () => openImageSelector(tier);
            newBtn.title = `点击添加图片到${tier.toUpperCase()}级`;
            newBtn.textContent = '+';
            // 虚拟按钮始终添加到末尾
            tierContent.appendChild(newBtn);
        }
    });
}

// 初始化
updateFileCount();

// 检查虚拟按钮
setTimeout(checkVirtualButtons, 100);
