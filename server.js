const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 初始化 DeepSeek
const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: process.env.DEEPSEEK_API_KEY
});

app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        console.log("收到主题:", message);
        if (!message) return res.status(400).json({ error: "主题不能为空" });

        const completion = await openai.chat.completions.create({
            messages: [
                // ==========================================
                // 核心修改：这里定义了 AI 的“诗人”人设
                // ==========================================
                { 
                    role: "system", 
                    content: "你是一位才华横溢的唐代诗人。用户的输入将是一个‘主题’。请你必须严格根据该主题，创作一首【七言绝句】。要求：1. 严格遵守七言绝句格式（共四句，每句七个字）。2. 讲究平仄押韵，意境优美。3. 直接输出诗句，不要带任何'好的'、'如下所示'等废话。4. 诗名自拟，格式为：\n《诗名》\n诗句..." 
                },
                { role: "user", content: message }
            ],
            model: "deepseek-chat",
        });

        const reply = completion.choices[0].message.content;
        res.json({ reply: reply });

    } catch (error) {
        console.error('DeepSeek Error:', error);
        res.status(500).json({ error: '诗人正在斟酌推敲，请稍后再试...' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Poet Server is running on port ${port}`);
});