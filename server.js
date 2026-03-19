const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

// 1. Middleware
app.use(express.json());
app.use(express.static(__dirname)); // Serves your HTML/CSS/JS files

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
    const { username } = req.body;
    try {
        // Find user (case-insensitive)
        let user = await User.findOne({ username: new RegExp(`^${username}$`, 'i') });
        
        if (!user) {
            // Create new user if they don't exist
            user = new User({ username });
            await user.save();
            console.log(`✨ New User Created: ${username}`);
        }
        
        res.json({ success: true, user });
    } catch (err) {
        console.error("Registration Error:", err);
        res.status(500).json({ success: false, error: "Database error" });
    }
});

// Route: Get a specific user's data (For Search & Profiles)
app.get('/api/user/:username', async (req, res) => {
    try {
        const username = req.params.username;
        const user = await User.findOne({ username: new RegExp(`^${username}$`, 'i') });
        
        if (user) {
            res.json({ success: true, user });
        } else {
            res.status(404).json({ success: false, message: "User not found" });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 5. Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});