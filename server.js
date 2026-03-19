const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

const USERS_FILE = path.join(__dirname, 'api', 'users.json');

app.post('/api/register', (req, res) => {
    const { username } = req.body;

    // Load existing users
    let users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));

    // Check if user exists, otherwise create them
    let user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (!user) {
        user = {
            username: username,
            robux: "0",
            tix: "10",
            status: "Online",
            avatar: "images/User_Avatar.png",
            joinDate: "3/18/2026",
            blurb: "Welcome to my profile!"
        };
        users.push(user);
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 4));
    }

    res.json({ success: true, user: user });
});

app.listen(3000, () => console.log('Server running at http://localhost:3000'));