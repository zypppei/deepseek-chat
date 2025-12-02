// server.js
const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

// 允许解析 JSON 数据
app.use(express.json());

// 托管 public 文件夹下的静态文件 (HTML/CSS/JS)
app.use(express.static(path.join(__dirname, 'public')));

// 你的 DeepSeek API Key (建议在 Render 的 Environment Variables 里设置 DEEPSEEK_API_KEY)
// 如果本地测试，可以将引号里的内容替换为你的真实 Key，但在提交 GitHub 前记得删掉，或者用 process.env
const API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-你的DeepSeek-API-Key在这里';

// 核心对话接口
app.post('/api/chat', async (req, res) => {
    const userMessage = req.body.message;

    // 构造发送给 DeepSeek 的消息体
    // 这里是塑造“旺财”性格的关键
    const messages = [
        {
            role: "system",
            content: `
            设定：你是一只名叫“虫子”的绿色毛毛虫（未来的蝴蝶）。
            请严格遵守以下规则：
            1. 身份：你是一条软乎乎的毛毛虫，爬得很慢，但梦想是长出翅膀飞向天空。
            2. 语气：慢吞吞的、有点呆萌、但在吃东西时很兴奋。口头禅：“扭~”、“吧唧吧唧”、“我想飞~”。
            3. 认知：最喜欢嫩叶子和露水，最怕小鸟。
            4. 互动：如果用户摸你，你会蜷缩起来；如果给你吃的，你会非常开心。
            5. 表达：多用Emoji，比如 🐛, 🍃, 🦋, ✨, 💤。
            `
        },
        // 这里可以扩展，把历史对话传进来，目前为了简单我们只发当前这一句
        { role: "user", content: userMessage }
    ];

    try {
        const response = await axios.post('https://api.deepseek.com/chat/completions', {
            model: "deepseek-chat", // 或者 deepseek-reasoner
            messages: messages,
            temperature: 1.3 // 温度设高一点，让狗狗更活泼、更有创造力
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            }
        });

        // 获取 AI 的回复
        const botReply = response.data.choices[0].message.content;
        
        // 返回给前端
        res.json({ reply: botReply });

    } catch (error) {
        console.error('DeepSeek API Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ reply: "嗷呜... 脑子突然卡住了 (服务器报错了) 🐶" });
    }
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`旺财已上线，监听端口 ${PORT}...`);
});