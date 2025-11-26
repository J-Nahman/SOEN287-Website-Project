const mysql = require('mysql');
const bcrypt = require('bcrypt');

const connection = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'password',
    database: 'booking_system'
});

connection.connect((err) => {
    if (err) {
        console.error('❌ Connection failed:', err.message);
        console.log('\n💡 Make sure Docker MySQL is running!');
        console.log('   Run: npm run docker-start');
        process.exit(1);
    }
    
    console.log('✅ Connected to MySQL');
    
    // Create users table
    const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
            user_id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            first_name VARCHAR(100),
            last_name VARCHAR(100),
            role ENUM('student', 'faculty', 'admin') NOT NULL,
            phone VARCHAR(20),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    
    connection.query(createUsersTable, (err) => {
        if (err) {
            console.error('❌ Error creating users table:', err);
            connection.end();
            process.exit(1);
        }
        
        console.log('✅ Users table created successfully');
        
        // Insert test users
        const testUsers = [
            { email: 'student@concordia.ca', password: 'student123', firstName: 'John', lastName: 'Student', role: 'student', phone: '514-123-4567' },
            { email: 'faculty@concordia.ca', password: 'faculty123', firstName: 'Jane', lastName: 'Professor', role: 'faculty', phone: '514-234-5678' },
            { email: 'admin@concordia.ca', password: 'admin123', firstName: 'Admin', lastName: 'User', role: 'admin', phone: '514-345-6789' }
        ];
        
        let processed = 0;
        
        testUsers.forEach(async (user) => {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            
            connection.query(
                'INSERT IGNORE INTO users (email, password_hash, first_name, last_name, role, phone) VALUES (?, ?, ?, ?, ?, ?)',
                [user.email, hashedPassword, user.firstName, user.lastName, user.role, user.phone],
                (err) => {
                    processed++;
                    if (err) {
                        console.error(`❌ Error inserting ${user.email}:`, err.message);
                    } else {
                        console.log(`✅ Test user created: ${user.email}`);
                    }
                    
                    if (processed === testUsers.length) {
                        console.log('\n🎉 Users table setup complete!');
                        console.log('\n📋 Test accounts:');
                        console.log('   student@concordia.ca / student123');
                        console.log('   faculty@concordia.ca / faculty123');
                        console.log('   admin@concordia.ca / admin123');
                        connection.end();
                    }
                }
            );
        });
    });
});