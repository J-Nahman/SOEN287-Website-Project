const express = require('express');
const cors = require('cors');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

//middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(bodyParser.json());
// Serve static files (CSS, JS, images) from root
app.use(express.static(__dirname));


const PORT = process.env.PORT || 3000;



// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'login'
});

// Database configuration 
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'login',
    port: process.env.DB_PORT || 3306,
    multipleStatements: true
};

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

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL');
});

// Serve the login page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Login route
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const query = 'SELECT type FROM user WHERE username = ? AND password = ?';
  db.query(query, [username, password], (err, results) => {
    if (err) throw err;

    if (results.length > 0) {
      const role = results[0].type;
      if (role === 'admin') {
        res.sendFile(path.join(__dirname, 'overviewA.html'));
      } else {
        res.sendFile(path.join(__dirname, 'overviewU.html'));
      }
    } else {
      // Add ?error=1 to indicate login failed
      res.redirect('/?error=1');
    }
  });
});

// Start server
app.listen(3000, () => console.log('Server running on port 3000'));

function executeQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

// Get all resources
app.get('/api/resources', async (req, res) => {
    try {
        const resources = await executeQuery('SELECT * FROM resources ORDER BY type, name');
        res.json(resources);
    } catch (error) {
        console.error('Error fetching resources:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// AUTH API IMPLEMENTATION
require('dotenv').config();
const session = require('express-session');
const cookieParser = require('cookie-parser');

// Middleware
app.use(cors({
    origin: 'http://127.0.0.1:5500',
    credentials: true
}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
    secret: 'concordia-booking-secret-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Import and setup authentication routes
const authModule = require('./auth-api');
authModule.setPool(pool);
app.use('/api/auth', authModule.router);


// everything past this is the booking system api's


// Utility function to execute queries with promises
function executeQueryB(sql, params = []) {
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
        const bookings = await executeQueryB(
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

        // Validation and special admin user 99999
        if ((!userId || userId === 'undefined') && userId !== 99999) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: userId'
            });
        }

        if (!resourceId || !date || !time_slot) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: resourceId, date, time_slot'
            });
        }

        let result;

        // Check if slot is already booked while allowing for admin override
        if (userId !== 99999) {
            const existingBookings = await executeQueryB(
                'SELECT id FROM bookings WHERE resource_id = ? AND date = ? AND time_slot = ?',
                [resourceId, date, time_slot]
            );

            console.log('📊 Existing bookings found:', existingBookings);

            if (existingBookings.length > 0) {
                return res.status(409).json({ success: false, error: 'This time slot is already booked' });
            }
            // Create new booking
            console.log('💾 Creating new booking in database...');
            result = await executeQueryB(
                'INSERT INTO bookings (user_id, resource_id, date, time_slot) VALUES (?, ?, ?, ?)',
                [userId, resourceId, date, time_slot]
            );
            console.log('✅ Booking created successfully, ID:', result.insertId);
        } else {
            //remove prev booking before blocking with admin id
            const deletePrev = await executeQueryB(
                'DELETE FROM bookings WHERE resource_id = ? AND date = ? AND time_slot = ?',
                [resourceId, date, time_slot]
            );
            //blocking with admin id
            console.log('🗑️ Deleted existing bookings:', deletePrev);
            result = await executeQueryB(
                'INSERT INTO bookings (user_id, resource_id, date, time_slot) VALUES (?, ?, ?, ?)',
                [userId, resourceId, date, time_slot]
            );
        }


        const message = userId === 99999 ? 'Time slot blocked successfully' : 'Booking created successfully';
        res.status(201).json({
            success: true,
            message: message,
            bookingId: result.insertId,
            userId,
            resourceId,
            date,
            time_slot
        });

    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ success: false, error: 'Internal server error' + error.message });
    }
});

// Get user's bookings
app.get('/api/users/:userId/bookings', async (req, res) => {
    try {
        const { userId } = req.params;

        const bookings = await executeQueryB(
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

        const bookings = await executeQueryB(
            `SELECT b.* 
            FROM bookings b
            ORDER BY b.date DESC, b.time_slot DESC`
        );

        console.log(`✅ Found ${bookings.length} bookings`);

        res.json(bookings);

    } catch (error) {
        console.error('Error fetching all bookings:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Delete a booking (admin cancelling)
app.get('/api/bookings/:id', async (req, res) => {

    try {
        const { id } = req.params;

        // Validate booking ID
        if (!id || isNaN(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid booking ID'
            });
        }

        // First, check if booking exists
        const existingBookings = await executeQueryB(
            'SELECT * FROM bookings WHERE id = ?',
            [id]
        );

        if (existingBookings.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Booking not found'
            });
        }

        const result = await executeQueryB(
            'DELETE FROM bookings WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Booking deleted successfully',
            deletedId: id,
            affectedRows: result.affectedRows
        });

    } catch (error) {
        console.error('Error deleting booking:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }

});

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        const result = await executeQueryB('SELECT 1 as test');
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
        const tables = await executeQueryB('SHOW TABLES');
        const columns = await executeQueryB('DESCRIBE bookings');

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