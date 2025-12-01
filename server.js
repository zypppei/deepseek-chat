const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const path = require('path'); // 引入路径处理模块
require('dotenv').config();

const app = express();
// Render 会自动提供一个端口，如果没有就用 3000
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 关键代码：告诉服务器，public 文件夹里的文件是静态资源（比如网页）
app.use(express.static(path.join(__dirname, 'public')));

// 初始化 DeepSeek
const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: process.env.DEEPSEEK_API_KEY
});

app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        console.log("收到消息:", message);
        if (!message) return res.status(400).json({ error: "消息不能为空" });

        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: "你是一个智能助手。" },
                { role: "user", content: message }
            ],
            model: "deepseek-chat",
        });

        const reply = completion.choices[0].message.content;
        res.json({ reply: reply });

    } catch (error) {
        console.error('DeepSeek Error:', error);
        res.status(500).json({ error: '服务器繁忙' });
    }
});

// 如果用户访问根目录 '/'，就发送 index.html 给通过
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});