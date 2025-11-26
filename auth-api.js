const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

let pool;

function setPool(dbPool) {
    pool = dbPool;
}

function executeQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) {
                reject(err);
                return;
            }
            
            connection.query(sql, params, (error, results) => {
                connection.release();
                if (error) {
                    reject(error);
                } else {
                    resolve(results || []);
                }
            });
        });
    });
}

// REGISTER
router.post('/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName, role } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({ 
                success: false,
                error: 'Email, password, and role are required' 
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const result = await executeQuery(
            'INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)',
            [email, passwordHash, firstName, lastName, role]
        );

        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            userId: result.insertId
        });

    } catch (error) {
        if (error.message.includes('Duplicate entry')) {
            return res.status(409).json({ 
                success: false,
                error: 'Email already exists' 
            });
        }
        console.error('Register error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error' 
        });
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    try {
        const { email, password, loginType } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                error: 'Email and password are required' 
            });
        }

        const users = await executeQuery('SELECT * FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.status(401).json({ 
                success: false,
                error: 'Invalid email or password' 
            });
        }

        const user = users[0];

        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!passwordMatch) {
            return res.status(401).json({ 
                success: false,
                error: 'Invalid email or password' 
            });
        }

        // Role-based access control (YOUR ORIGINAL LOGIC!)
        if (loginType === 'admin' && user.role !== 'admin') {
            return res.status(403).json({ 
                success: false,
                error: 'You are not an administrator! Please use Student/Faculty login.' 
            });
        }
        
        if (loginType === 'user' && user.role === 'admin') {
            return res.status(403).json({ 
                success: false,
                error: 'Please use Admin login!' 
            });
        }

        req.session.userId = user.user_id;
        req.session.userRole = user.role;
        req.session.userEmail = user.email;
        req.session.userName = `${user.first_name} ${user.last_name}`;

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                userId: user.user_id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error' 
        });
    }
});

// LOGOUT
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ 
                success: false,
                error: 'Could not log out' 
            });
        }
        res.json({ 
            success: true,
            message: 'Logout successful' 
        });
    });
});

// CHECK SESSION
router.get('/check', (req, res) => {
    if (req.session.userId) {
        res.json({
            success: true,
            loggedIn: true,
            user: {
                userId: req.session.userId,
                email: req.session.userEmail,
                role: req.session.userRole,
                name: req.session.userName
            }
        });
    } else {
        res.json({ 
            success: true,
            loggedIn: false 
        });
    }
});

module.exports = { router, setPool };