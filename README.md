# TierMaker - 游戏分级列表制作工具

一个现代化的游戏分级列表制作工具，支持拖拽操作和IGDB游戏数据库集成。

## 功能特点

- 🎯 **分级系统**：支持 S、A、B、C、D、F 六个等级
- 🖱️ **拖拽操作**：直观的拖拽排序功能
- 🎮 **游戏搜索**：集成IGDB API，搜索游戏并添加封面
- 📱 **响应式设计**：支持桌面端和移动端
- 💾 **数据持久化**：自动保存到本地存储
- 📊 **导出功能**：支持导出分级图为PNG

## 安装和运行

### 1. 克隆项目
```bash
git clone <your-repo-url>
cd tierboard
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置环境变量
复制 `.env.example` 文件为 `.env`：
```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的IGDB API密钥：
```env
IGDB_CLIENT_ID=your_client_id_here
IGDB_CLIENT_SECRET=your_client_secret_here
```

### 4. 获取IGDB API密钥
1. 访问 [IGDB API](https://api.igdb.com/)
2. 注册账号并创建应用
3. 获取 Client ID 和 Client Secret
4. 将密钥填入 `.env` 文件

### 5. 启动服务器
```bash
npm start
```

### 6. 访问应用
打开浏览器访问：`http://localhost:3000`

## 使用方法

1. **添加游戏**：点击任意等级的"+"按钮，搜索游戏并添加
2. **拖拽排序**：拖拽图片到不同等级或调整顺序
3. **导出结果**：点击"导出分级图"按钮保存为PNG
4. **清空重置**：点击"清空所有"按钮重置所有数据

## 技术栈

- **前端**：HTML5, CSS3, JavaScript (ES6+)
- **后端**：Node.js, Express
- **API**：IGDB (Internet Game Database)
- **样式**：CSS Grid, Flexbox, 响应式设计

## 项目结构

```
tierboard/
├── index.html          # 主页面
├── script.js           # 前端逻辑
├── styles.css          # 样式文件
├── proxy_server.js     # 代理服务器
├── package.json        # 项目配置
├── .env.example        # 环境变量模板
├── .gitignore          # Git忽略文件
└── README.md           # 项目说明
```

## 安全说明

- `.env` 文件包含敏感信息，已添加到 `.gitignore`
- 请勿将真实的API密钥提交到版本控制系统
- 在生产环境中使用环境变量管理敏感信息

## 许可证

MIT License
