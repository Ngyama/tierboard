const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = 3000;

// 启用CORS
app.use(cors());
app.use(express.json());

// IGDB API代理端点
app.post('/api/igdb/games', async (req, res) => {
    try {
        const CLIENT_ID = process.env.IGDB_CLIENT_ID;
        const CLIENT_SECRET = process.env.IGDB_CLIENT_SECRET;
        
        if (!CLIENT_ID || !CLIENT_SECRET) {
            throw new Error('IGDB API credentials not found. Please check your .env file.');
        }
        
        // 获取新的Access Token
        const tokenResponse = await fetch('https://id.twitch.tv/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                'client_id': CLIENT_ID,
                'client_secret': CLIENT_SECRET,
                'grant_type': 'client_credentials'
            })
        });
        
        if (!tokenResponse.ok) {
            throw new Error(`获取Token失败: ${tokenResponse.status}`);
        }
        
        const tokenData = await tokenResponse.json();
        const ACCESS_TOKEN = tokenData.access_token;
        
        // 调用IGDB API
        const igdbResponse = await fetch('https://api.igdb.com/v4/games', {
            method: 'POST',
            headers: {
                'Client-ID': CLIENT_ID,
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Accept': 'application/json',
                'Content-Type': 'text/plain'
            },
            body: req.body.query || JSON.stringify(req.body)
        });
        
        if (!igdbResponse.ok) {
            throw new Error(`IGDB API请求失败: ${igdbResponse.status}`);
        }
        
        const games = await igdbResponse.json();
        res.json(games);
        
    } catch (error) {
        console.error('IGDB API代理错误:', error);
        res.status(500).json({ error: error.message });
    }
});

// Bangumi API代理端点
app.post('/api/bangumi/anime', async (req, res) => {
    try {
        const API_KEY = process.env.BANGUMI_API_KEY;
        const { query, limit = 20 } = req.body;
        
        if (!query) {
            throw new Error('搜索查询不能为空');
        }
        
        // 构建请求头
        const headers = {
            'User-Agent': 'TierMaker/1.0 (https://github.com/your-repo)',
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Cookie': `chii_searchDateLine=${Date.now()}`
        };
        
        // 如果有 API Key，添加到请求头
        if (API_KEY) {
            headers['Authorization'] = `Bearer ${API_KEY}`;
        }
        
        // 调用 Bangumi API 搜索动画
        const searchUrl = 'https://api.bgm.tv/v0/search/subjects';
        const requestBody = {
            keyword: query,
            type: 2,
            limit: Math.min(limit, 50)
        };
        
        const bangumiResponse = await fetch(searchUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody)
        });
        
        if (!bangumiResponse.ok) {
            const errorText = await bangumiResponse.text();
            throw new Error(`Bangumi API请求失败: ${bangumiResponse.status} ${bangumiResponse.statusText}`);
        }
        
        const data = await bangumiResponse.json();
        const items = data.data || data.list || [];
        
        // 格式化返回数据
        const animeList = items
            .filter(item => item.images) // 只返回有封面的结果
            .map(item => ({
                id: item.id,
                name: item.name_cn || item.name || '未知标题',
                name_jp: item.name || '',
                summary: item.summary || '',
                cover: item.images ? (item.images.large || item.images.medium || item.images.small || item.images.grid || null) : null,
                rating: item.rating ? (item.rating.score || 0) : 0,
                date: item.date || ''
            }));
        
        res.json(animeList);
        
    } catch (error) {
        console.error('Bangumi API代理错误:', error);
        res.status(500).json({ error: error.message });
    }
});

// Google Books API代理端点
app.post('/api/google/books', async (req, res) => {
    try {
        const API_KEY = process.env.GOOGLE_BOOKS_API_KEY;
        
        if (!API_KEY) {
            throw new Error('Google Books API Key not found. Please check your .env file.');
        }
        
        const { query, maxResults = 20 } = req.body;
        if (!query) {
            throw new Error('搜索查询不能为空');
        }
        
        // 调用Google Books API
        const booksResponse = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&key=${API_KEY}&maxResults=${maxResults}&langRestrict=zh`);
        
        if (!booksResponse.ok) {
            throw new Error(`Google Books API请求失败: ${booksResponse.status}`);
        }
        
        const data = await booksResponse.json();
        
        // 格式化返回数据
        const books = data.items ? data.items.map(item => {
            const volumeInfo = item.volumeInfo;
            return {
                id: item.id,
                title: volumeInfo.title || '未知标题',
                authors: volumeInfo.authors ? volumeInfo.authors.join(', ') : '未知作者',
                cover: volumeInfo.imageLinks ? volumeInfo.imageLinks.thumbnail : null,
                description: volumeInfo.description || '',
                publishedDate: volumeInfo.publishedDate || '',
                averageRating: volumeInfo.averageRating || 0,
                pageCount: volumeInfo.pageCount || 0,
                language: volumeInfo.language || 'zh'
            };
        }) : [];
        
        res.json(books);
        
    } catch (error) {
        console.error('Google Books API代理错误:', error);
        res.status(500).json({ error: error.message });
    }
});

const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`代理服务器运行在 http://localhost:${PORT}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ 错误: 端口 ${PORT} 已被占用！`);
        console.error(`\n请执行以下操作之一：`);
        console.error(`1. 关闭占用端口 ${PORT} 的进程`);
        console.error(`2. 在 Windows 上运行: netstat -ano | findstr :${PORT}`);
        console.error(`   然后使用任务管理器结束对应的进程`);
        console.error(`3. 或者在 PowerShell 中运行: Get-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess | Stop-Process\n`);
        process.exit(1);
    } else {
        console.error('服务器启动错误:', err);
        process.exit(1);
    }
});
