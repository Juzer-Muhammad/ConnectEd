// app.js - Node.js without npm
const http = require('http');
const fs = require('fs');
const url = require('url');
const crypto = require('crypto');
const { parse } = require('querystring');

const PORT = 3000;
const users = {}; // In-memory store (replace with file or database in production)
const messages = {}; // In-memory store for messages

// Simple session management
const sessions = {};

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    // Parse request body
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        const data = parse(body);

        // User Profiles
        if (pathname === '/register' && method === 'POST') {
            const { email, password, role } = data;
            if (!users[email]) {
                const hash = crypto.createHash('sha256').update(password).digest('hex');
                users[email] = { role, password: hash, created_at: new Date().toISOString() };
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'User registered', user: email }));
            } else {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'User exists' }));
            }
        }

        // Login
        else if (pathname === '/login' && method === 'POST') {
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
        }

        // Profile
        else if (pathname === '/profile' && method === 'GET') {
            const sessionId = parsedUrl.query.sessionId;
            if (sessions[sessionId]) {
                const email = sessions[sessionId];
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(users[email] || {}));
            } else {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Not logged in' }));
            }
        }

        // Smart Matching (Placeholder without SageMaker)
        else if (pathname === '/match' && method === 'POST') {
            const { preferences } = data;
            // Simulate matching logic
            const matches = Object.keys(users).filter(u => u !== sessions[parsedUrl.query.sessionId] && users[u].role !== users[sessions[parsedUrl.query.sessionId]].role);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ matches }));
        }

        // Secure Messaging
        else if (pathname === '/send_message' && method === 'POST') {
            const sessionId = parsedUrl.query.sessionId;
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
        }

        else if (pathname === '/messages' && method === 'GET') {
            const sessionId = parsedUrl.query.sessionId;
            if (sessions[sessionId]) {
                const receiver = sessions[sessionId];
                const userMessages = Object.values(messages).filter(m => m.receiver === receiver);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(userMessages));
            } else {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Not logged in' }));
            }
        }

        // Online Whiteboard (Serve HTML)
        else if (pathname === '/whiteboard') {
            fs.readFile('whiteboard.html', (err, data) => {
                if (err) {
                    res.writeHead(500);
                    res.end('Error loading whiteboard');
                } else {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(data);
                }
            });
        }

        // Payment System (Placeholder)
        else if (pathname === '/pay' && method === 'POST') {
            const sessionId = parsedUrl.query.sessionId;
            if (sessions[sessionId]) {
                const { amount } = data;
                const receipt = `Payment of $${amount} by ${sessions[sessionId]} at ${new Date().toISOString()}`;
                // Placeholder: In production, use fs to save to file or integrate with payment gateway
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Payment processed', receipt }));
            } else {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Not logged in' }));
            }
        }

        // Default
        else {
            res.writeHead(404);
            res.end('Not Found');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

