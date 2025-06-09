const http = require('http');
const fs = require('fs');
const url = require('url');
const crypto = require('crypto');
const { parse } = require('querystring');

const PORT = 3000;
const users = {}; // In-memory store
const messages = {}; // In-memory store for messages
const sessions = {}; // Session management
const blogPosts = {}; // In-memory store for blog
const progress = {}; // In-memory store for progress

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        const data = parse(body);
        const sessionId = parsedUrl.query.sessionId;

        if (pathname === '/register' && method === 'POST') {
            const { email, password, role, qualifications, subjects, grades, style } = data;
            if (!users[email]) {
                const hash = crypto.createHash('sha256').update(password).digest('hex');
                users[email] = { role, password: hash, qualifications, subjects, grades, style, created_at: new Date().toISOString() };
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'User registered', user: email }));
            } else {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'User exists' }));
            }
        } else if (pathname === '/login' && method === 'POST') {
            const { email, password } = data;
            const hash = crypto.createHash('sha256').update(password).digest('hex');
            if (users[email] && users[email].password === hash) {
                const sessionId = crypto.randomBytes(16).toString('hex');
                sessions[sessionId] = email;
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Logged in', sessionId }));
            } else {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid credentials' }));
            }
        } else if (pathname === '/profile' && method === 'GET') {
            if (sessions[sessionId]) {
                const email = sessions[sessionId];
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(users[email] || {}));
            } else {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Not logged in' }));
            }
        } else if (pathname === '/match' && method === 'POST') {
            if (sessions[sessionId]) {
                const { subjects, grades, style } = users[sessions[sessionId]] || {};
                const matches = Object.keys(users).filter(u => u !== sessions[sessionId] && users[u].role === 'teacher' &&
                    (!subjects || users[u].subjects.includes(subjects)) &&
                    (!grades || users[u].grades.includes(grades)) &&
                    (!style || users[u].style.includes(style)));
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ matches }));
            } else {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Not logged in' }));
            }
        } else if (pathname === '/send_message' && method === 'POST') {
            if (sessions[sessionId]) {
                const { receiver, content } = data;
                const messageId = crypto.randomBytes(16).toString('hex');
                messages[messageId] = { sender: sessions[sessionId], receiver, content, timestamp: new Date().toISOString() };
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Message sent', id: messageId }));
            } else {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Not logged in' }));
            }
        } else if (pathname === '/messages' && method === 'GET') {
            if (sessions[sessionId]) {
                const receiver = sessions[sessionId];
                const userMessages = Object.values(messages).filter(m => m.receiver === receiver);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(userMessages));
            } else {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Not logged in' }));
            }
        } else if (pathname === '/whiteboard') {
            fs.readFile('whiteboard.html', (err, data) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Error loading whiteboard');
                } else {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(data);
                }
            });
        } else if (pathname === '/blog' && method === 'POST') {
            if (sessions[sessionId] && users[sessions[sessionId]].role === 'teacher') {
                const { content } = data;
                const postId = crypto.randomBytes(16).toString('hex');
                blogPosts[postId] = { author: sessions[sessionId], content, timestamp: new Date().toISOString() };
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Blog post created' }));
            } else {
                res.writeHead(403, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Only teachers can post blogs' }));
            }
        } else if (pathname === '/pay' && method === 'POST') {
            if (sessions[sessionId]) {
                const { amount } = data;
                const receipt = `Payment of $${amount} by ${sessions[sessionId]} at ${new Date().toISOString()}`;
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Payment processed', receipt }));
            } else {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Not logged in' }));
            }
        } else if (pathname === '/progress' && method === 'GET') {
            if (sessions[sessionId]) {
                const email = sessions[sessionId];
                if (!progress[email]) progress[email] = { updates: [], lastUpdate: null };
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(progress[email]));
            } else {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Not logged in' }));
            }
        } else if (pathname === '/') {
            fs.readFile('index.html', (err, data) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Error loading home page');
                } else {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(data);
                }
            });
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});