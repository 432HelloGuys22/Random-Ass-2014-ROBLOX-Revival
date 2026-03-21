const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors'); // Only need this once

const app = express(); // Define app once

app.use(cors()); // Enable CORS so your website can talk to the server
app.use(express.json());
app.use(express.static(__dirname));

// 2. MongoDB Connection String
const dbURI = 'mongodb+srv://danf54145_db_user:NvkB7vZTFMeCYLgZ@bloxdata.y6ms9qn.mongodb.net/BloxData?retryWrites=true&w=majority';

mongoose.connect(dbURI)
  .then(() => console.log("✅ Connected to BloxData Cloud!"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// 3. User Schema (What a player looks like in the DB)
const userSchema = new mongoose.Schema({
    username: String,
    robux: { type: String, default: "0" },
    tix: { type: String, default: "10" },
    status: { type: String, default: "Online" },
    avatar: { type: String, default: "images/User_Avatar.png" },
    joinDate: { type: String, default: "3/19/2026" },
    blurb: { type: String, default: "Welcome to my profile!" }
});

const User = mongoose.model('User', userSchema);

// 4. API Routes

// Route: Register or Login a user
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

    // 2. Mandatory Check (Backend)
    if (!username || !password) {
        return res.status(400).json({ success: false, message: "Username and Password are required!" });
    }

    try {
        const newUser = new User({ username, password });
        await newUser.save();
        res.json({ success: true, user: newUser });
    } catch (err) {
        res.status(500).json({ success: false, message: "User already exists or database error." });
    }
});

// 5. LOGIN ROUTE
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Find the user with matching name and password
        const user = await User.findOne({ username, password });

        if (user) {
            // Success! Send the user data back to the browser
            res.json({ success: true, user: user });
        } else {
            // Failure: Wrong username or password
            res.status(401).json({ success: false, message: "Invalid username or password." });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error during login." });
    }
});