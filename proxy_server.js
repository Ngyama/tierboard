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
    console.log('收到API请求:', req.body);
    try {
        const CLIENT_ID = process.env.IGDB_CLIENT_ID;
        const CLIENT_SECRET = process.env.IGDB_CLIENT_SECRET;
        
        console.log('环境变量检查:', {
            CLIENT_ID: CLIENT_ID ? '已设置' : '未设置',
            CLIENT_SECRET: CLIENT_SECRET ? '已设置' : '未设置'
        });
        
        if (!CLIENT_ID || !CLIENT_SECRET) {
            throw new Error('IGDB API credentials not found. Please check your .env file.');
        }
        
        console.log('获取Token...');
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
        console.log('Token获取成功');
        
        console.log('调用IGDB API...');
        console.log('请求体:', req.body);
        
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
        console.log(`返回 ${games.length} 个游戏`);
        res.json(games);
        
    } catch (error) {
        console.error('代理错误:', error);
        res.status(500).json({ error: error.message });
    }
});

// Google Books API代理端点
app.post('/api/google/books', async (req, res) => {
    console.log('收到Google Books API请求:', req.body);
    try {
        const API_KEY = process.env.GOOGLE_BOOKS_API_KEY;
        
        console.log('Google Books API Key检查:', {
            API_KEY: API_KEY ? '已设置' : '未设置'
        });
        
        if (!API_KEY) {
            throw new Error('Google Books API Key not found. Please check your .env file.');
        }
        
        const { query, maxResults = 20 } = req.body;
        if (!query) {
            throw new Error('搜索查询不能为空');
        }
        
        console.log('调用Google Books API...');
        
        // 调用Google Books API
        const booksResponse = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&key=${API_KEY}&maxResults=${maxResults}&langRestrict=zh`);
        
        if (!booksResponse.ok) {
            throw new Error(`Google Books API请求失败: ${booksResponse.status}`);
        }
        
        const data = await booksResponse.json();
        console.log(`返回 ${data.items ? data.items.length : 0} 本书籍`);
        
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

app.listen(PORT);
