// 全局变量
let imageCounter = 0;
let tierData = {
    s: [],
    a: [],
    b: [],
    c: [],
    d: [],
    f: [],
    unassigned: []
};

// 页面加载时恢复数据
document.addEventListener('DOMContentLoaded', function() {
    loadFromLocalStorage();
    setupEventListeners();
});

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
        const dropZone = document.createElement('div');
        dropZone.className = 'drop-zone';
        dropZone.textContent = '拖拽图片到这里开始分级，或点击上方按钮上传图片';
        unassignedGrid.appendChild(dropZone);
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

// 添加示例图片
function addSampleImages() {
    const sampleImages = [
        'https://via.placeholder.com/80x80/ff6b6b/ffffff?text=1',
        'https://via.placeholder.com/80x80/4ecdc4/ffffff?text=2',
        'https://via.placeholder.com/80x80/45b7d1/ffffff?text=3',
        'https://via.placeholder.com/80x80/f9ca24/ffffff?text=4',
        'https://via.placeholder.com/80x80/6c5ce7/ffffff?text=5',
        'https://via.placeholder.com/80x80/a29bfe/ffffff?text=6'
    ];
    
    sampleImages.forEach((src, index) => {
        const imageData = {
            id: 'sample_' + Date.now() + '_' + index,
            src: src,
            name: `示例图片 ${index + 1}`
        };
        
        tierData.unassigned.push(imageData);
        createTierItem(imageData, 'unassigned');
    });
    
    updateFileCount();
    saveToLocalStorage();
}

// 清空所有
function clearAll() {
    if (confirm('确定要清空所有图片吗？')) {
        tierData = {
            s: [],
            a: [],
            b: [],
            c: [],
            d: [],
            f: [],
            unassigned: []
        };
        
        // 清空DOM，但保留虚拟按钮
        document.querySelectorAll('.tier-content').forEach(content => {
            const items = content.querySelectorAll('.tier-item');
            items.forEach(item => item.remove());
        });
        
        const unassignedGrid = document.getElementById('unassignedGrid');
        unassignedGrid.innerHTML = '<div class="drop-zone">拖拽图片到这里开始分级，或点击上方按钮上传图片</div>';
        
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
        localStorage.setItem('tierMakerData', JSON.stringify(tierData));
    } catch (e) {
        console.warn('无法保存到本地存储:', e);
    }
}

// 从本地存储加载
function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('tierMakerData');
        if (saved) {
            tierData = JSON.parse(saved);
            renderTierData();
            updateFileCount();
        }
    } catch (e) {
        console.warn('无法从本地存储加载数据:', e);
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
        // 反转数组，让最新的图片在前面
        const reversedData = [...tierData[tier]].reverse();
        reversedData.forEach(imageData => {
            createTierItem(imageData, tier);
        });
    });
    
    // 如果未分级区域为空，显示提示
    if (tierData.unassigned.length === 0) {
        const dropZone = document.createElement('div');
        dropZone.className = 'drop-zone';
        dropZone.textContent = '拖拽图片到这里开始分级，或点击上方按钮上传图片';
        unassignedGrid.appendChild(dropZone);
    }
    
    // 确保虚拟按钮存在
    setTimeout(checkVirtualButtons, 50);
}

// 全局变量存储当前选择的等级
let currentSelectedTier = '';

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
    const searchInput = document.getElementById('gameSearchInput');
    
    console.log('侧边栏元素:', sidebar);
    console.log('搜索输入框:', searchInput);
    
    sidebar.style.display = 'flex';
    searchInput.focus();
    
    // 清空之前的结果
    document.getElementById('searchResults').innerHTML = '';
    
    // 添加回车键搜索功能
    searchInput.onkeypress = function(e) {
        if (e.key === 'Enter') {
            console.log('回车键被按下，开始搜索');
            searchGames();
        }
    };
}


// 关闭游戏搜索侧边栏
function closeGameSearchModal() {
    document.getElementById('gameSearchSidebar').style.display = 'none';
    currentSelectedTier = '';
}

// 搜索游戏
async function searchGames() {
    console.log('searchGames 函数被调用');
    const searchInput = document.getElementById('gameSearchInput');
    const searchQuery = searchInput.value.trim();
    const resultsContainer = document.getElementById('searchResults');
    
    console.log('搜索查询:', searchQuery);
    
    if (!searchQuery) {
        alert('请输入游戏名称');
        return;
    }
    
    // 显示加载状态
    resultsContainer.innerHTML = '<div class="no-results">🔍 搜索中...</div>';
    console.log('开始搜索游戏:', searchQuery);
    
    try {
        const games = await fetchGamesFromIGDBAPI(searchQuery);
        console.log('搜索完成，准备显示结果');
        displaySearchResults(games);
    } catch (error) {
        console.error('搜索失败:', error);
        console.error('错误详情:', error.message);
        resultsContainer.innerHTML = `<div class="no-results">❌ 搜索失败: ${error.message}<br><br>请检查：<br>1. 网络连接<br>2. API密钥是否正确<br>3. Token是否过期</div>`;
    }
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
function displaySearchResults(games) {
    const resultsContainer = document.getElementById('searchResults');
    
    console.log('displaySearchResults 被调用，游戏数量:', games.length);
    console.log('游戏数据:', games);
    
    if (games.length === 0) {
        resultsContainer.innerHTML = '<div class="no-results">😔 未找到相关游戏</div>';
        return;
    }
    
    try {
        resultsContainer.innerHTML = games.map(game => {
            const coverUrl = game.cover && game.cover.url 
                ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}` 
                : 'https://via.placeholder.com/200x120?text=No+Cover';
            
            return `
                <div class="game-result" onclick="selectGame('${game.id}', '${game.name.replace(/'/g, "\\'")}', '${coverUrl}')">
                    <img src="${coverUrl}" alt="${game.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/200x120?text=No+Cover'">
                    <h3>${game.name}</h3>
                    <p>${game.summary ? game.summary.substring(0, 100) + '...' : '暂无描述'}</p>
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
