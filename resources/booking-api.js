require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database configuration matching your launcher
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'booking_system',
    port: process.env.DB_PORT || 3306,
    multipleStatements: false
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
    } else {
        console.log('✅ Connected to MySQL database');
        connection.release();
    }
});

// Utility function to execute queries with promises
function executeQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) {
                console.error('❌ Database connection error:', err);
                reject(err);
                return;
            }

            console.log('🔍 Executing query:', sql, 'with params:', params);
            
            connection.query(sql, params, (error, results) => {
                connection.release();
                
                if (error) {
                    console.error('❌ Query execution error:', error);
                    reject(error);
                } else {
                    console.log('✅ Query successful, results:', results);
                    resolve(results || []); // Always return at least an empty array
                }
            });
        });
    });
}

// API Routes

// Get available time slots for a specific date
app.get('/api/available-slots', async (req, res) => {
    try {
        const { date, resourceId = 1 } = req.query;
        
        console.log('📥 Available slots request - date:', date);

        if (!date) {
            return res.status(400).json({ error: 'Date is required' });
        }

        console.log('🔍 Querying database for booked slots...');

        // Get all bookings for the specified date and resource
        const bookings = await executeQuery(
            'SELECT time_slot FROM bookings WHERE date = ? AND resource_id = ?',
            [date, resourceId]
        );

        const bookedTimeSlots = bookings.map(booking => booking.time_slot);
        
        console.log('✅ Sending response with', bookedTimeSlots.length, 'booked slots');
        
        return res.json({
            date,
            resourceId,
            bookedTimeSlots
        });
        
    } catch (error) {
        console.error('Error fetching available slots:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a new booking
app.post('/api/bookings', async (req, res) => {
    try {
        const { userId, resourceId, date, time_slot } = req.body;
        
        console.log('📥 Booking request received:', { userId, resourceId, date, time_slot });

        // Validation
        if (!userId || !resourceId || !date || !time_slot) {
            return res.status(400).json({ 
                error: 'Missing required fields: userId, resourceId, date, time_slot' 
            });
        }
        
        // Check if slot is already booked
        const existingBookings = await executeQuery(
            'SELECT id FROM bookings WHERE resource_id = ? AND date = ? AND time_slot = ?',
            [resourceId, date, time_slot]
        );

         console.log('📊 Existing bookings found:', existingBookings);

        if (existingBookings.length > 0) {
            return res.status(409).json({ success: false, error: 'This time slot is already booked' });
        }
        
        // Create new booking
        console.log('💾 Creating new booking in database...');
        const result = await executeQuery(
           'INSERT INTO bookings (user_id, resource_id, date, time_slot) VALUES (?, ?, ?, ?)',
            [userId, resourceId, date, time_slot]
        );
        console.log('✅ Booking created successfully, ID:', result.insertId);
        
        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            bookingId: result.insertId,
            userId,
            resourceId,
            date,
            time_slot
        });
        
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({success: false, error: 'Internal server error' + error.message});
    }
});

// Get user's bookings
app.get('/api/users/:userId/bookings', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const bookings = await executeQuery(
            `SELECT id, resource_id, date, time_slot, created_at 
             FROM bookings 
             WHERE user_id = ? 
             ORDER BY date DESC, time_slot DESC`,
            [userId]
        );
        
        res.json(bookings);
        
    } catch (error) {
        console.error('Error fetching user bookings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all bookings (for admin purposes)
app.get('/api/bookings', async (req, res) => {
    try {
        const bookings = await executeQuery(
            `SELECT * FROM bookings ORDER BY date DESC, time_slot DESC`
        );
        
        res.json(bookings);
        
    } catch (error) {
        console.error('Error fetching all bookings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        const result = await executeQuery('SELECT 1 as test');
        res.json({ 
            status: 'OK', 
            database: 'Connected',
            table: 'bookings',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'Error', 
            database: 'Disconnected',
            error: error.message 
        });
    }
});

// Database info endpoint
app.get('/api/db-info', async (req, res) => {
    try {
        const tables = await executeQuery('SHOW TABLES');
        const columns = await executeQuery('DESCRIBE bookings');
        
        res.json({
            database: dbConfig.database,
            tables: tables.map(t => Object.values(t)[0]),
            bookingsTableStructure: columns
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// shutdown
process.on('SIGINT', () => {
    console.log('\n🔌 Closing database connections...');
    pool.end((err) => {
        if (err) {
            console.error('Error closing connections:', err);
        } else {
            console.log('Database connections closed.');
        }
        process.exit(0);
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Database: ${dbConfig.database}`);
    console.log(`🔌 MySQL: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`🌐 API available at: http://localhost:${PORT}/api`);
});