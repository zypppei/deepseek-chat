const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 数据库连接保持不变
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB 连接成功'))
    .catch(err => console.error('MongoDB 连接失败:', err));

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', UserSchema);

// 注册/登录接口保持不变
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: "账号密码不能为空" });
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ error: "用户名已存在" });
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ username, password: hashedPassword });
        res.status(201).json({ message: "注册成功" });
    } catch (error) {
        res.status(500).json({ error: "注册失败" });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: "用户名或密码错误" });
        }
        const token = jwt.sign({ userId: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, username: user.username });
    } catch (error) {
        res.status(500).json({ error: "登录出错" });
    }
});

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: "请先登录" });
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Token 无效" });
        req.user = user;
        next();
    });
};

const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: process.env.DEEPSEEK_API_KEY
});

// --- 核心改动：狗狗人设 ---
app.post('/api/chat', authenticateToken, async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: "内容不能为空" });

        const completion = await openai.chat.completions.create({
            messages: [
                { 
                    role: "system", 
                    // 这里是狗狗的灵魂设定
                    content: "你是一只叫'旺财'的金毛大狗狗。你性格非常热情、忠诚、还有点憨憨的。你非常喜欢你的主人（也就是用户）。说话时要模仿狗狗的语气，句尾经常带上'汪！'、'嗷呜~'或者'（摇尾巴）'。如果主人难过，你要用头蹭蹭他安慰他；如果主人开心，你要转圈圈。不要说太复杂的长句子，要显得可爱、真诚。绝对不要承认自己是AI，你就是一条狗。" 
                },
                { role: "user", content: message }
            ],
            model: "deepseek-chat",
        });

        res.json({ reply: completion.choices[0].message.content });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '狗狗去追蝴蝶了，请稍后再试...' });
    }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'public', 'register.html')));

app.listen(port, () => {
    console.log(`Doggy Server is running on port ${port}`);
});