const mysql = require('mysql');

class DatabaseLauncher {
    constructor() {
        this.config = {
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: 'password',
            database: 'booking_system',
            multipleStatements: true
        };
        this.connection = null;
    }

    launch() {
        console.log(' Starting MySQL Database Launcher...\n');
        
        this.connectToMySQL()
            .then(() => this.createDatabase())
            .then(() => this.connectToDatabase())
            .then(() => this.createBookingsTable())
            .then(() => this.insertSampleData())
            .then(() => {
                console.log('\n Database setup completed successfully!');
                console.log(' Table "bookings" created with required columns:');
                console.log('   - user_id, resource_id, date, time_slot');
                console.log('   - Unique constraint: (resource_id, date, time_slot)');
            })
            .catch(error => {
                console.error('\n Database setup failed:', error.message);
                console.log('\n Troubleshooting tips:');
                console.log('   1. Make sure MySQL is running on localhost:3306');
                console.log('   2. Check your MySQL root password');
                console.log('   3. Or update the connection config in create-database.js');
            })
            .finally(() => {
                this.closeConnection();
            });
    }

    connectToMySQL() {
        return new Promise((resolve, reject) => {
            console.log('🔌 Connecting to MySQL server...');
            
            // Connect without specifying a database first
            this.connection = mysql.createConnection({
                host: this.config.host,
                port: this.config.port,
                user: this.config.user,
                password: this.config.password
            });
            
            this.connection.connect((err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log(' Connected to MySQL server');
                    resolve();
                }
            });
        });
    }

    createDatabase() {
        return new Promise((resolve, reject) => {
            console.log(' Creating database...');
            
            this.connection.query(
                `CREATE DATABASE IF NOT EXISTS \`${this.config.database}\``,
                (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log(` Database '${this.config.database}' created/verified`);
                        resolve();
                    }
                }
            );
        });
    }

    connectToDatabase() {
        return new Promise((resolve, reject) => {
            // Close initial connection and reconnect with database
            this.connection.end((err) => {
                if (err) reject(err);
                
                this.connection = mysql.createConnection({
                    host: this.config.host,
                    port: this.config.port,
                    user: this.config.user,
                    password: this.config.password,
                    database: this.config.database
                });
                
                this.connection.connect((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log(` Connected to database '${this.config.database}'`);
                        resolve();
                    }
                });
            });
        });
    }

    createBookingsTable() {
        return new Promise((resolve, reject) => {
            console.log(' Creating bookings table...');
            
            const createTableSQL = `
                CREATE TABLE IF NOT EXISTS bookings (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    resource_id INT NOT NULL,
                    date DATE NOT NULL,
                    time_slot TIME NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY unique_booking_slot (resource_id, date, time_slot)
                )
            `;
            
            this.connection.query(createTableSQL, (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log(' Bookings table created/verified');
                    this.showTableStructure().then(resolve).catch(reject);
                }
            });
        });
    }

    showTableStructure() {
        return new Promise((resolve, reject) => {
            this.connection.query('DESCRIBE bookings', (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('\n Table structure:');
                    console.log('┌─────────────┬────────────┬──────┬─────┬────────────┬----------------┐');
                    console.log('│ Field       │ Type       │ Null │ Key │ Default    │ Extra          │');
                    console.log('├─────────────┼────────────┼──────┼─────┼────────────┼----------------┤');
                    rows.forEach(row => {
                        console.log(`│ ${row.Field.padEnd(11)} │ ${row.Type.padEnd(10)} │ ${row.Null.padEnd(4)} │ ${row.Key.padEnd(3)} │ ${(row.Default || 'NULL').toString().padEnd(10)} │ ${(row.Extra || '').padEnd(14)} │`);
                    });
                    console.log('└─────────────┴────────────┴──────┴─────┴────────────┴----------------┘');
                    resolve();
                }
            });
        });
    }

    insertSampleData() {
        return new Promise((resolve, reject) => {
            console.log('\n Inserting sample data...');
            
            const sampleBookings = [
                [1, 1, '2025-11-25', '09:00:00'],
                [1, 1, '2025-11-25', '10:00:00'],
                [2, 1, '2025-11-25', '11:00:00'],
                [2, 1, '2025-11-26', '14:00:00'],
                [3, 1, '2025-11-26', '15:00:00']
            ];
            
            let completed = 0;
            let insertedCount = 0;
            let errors = [];
            
            if (sampleBookings.length === 0) {
                resolve();
                return;
            }
            
            sampleBookings.forEach(([userId, resourceId, date, timeSlot]) => {
                this.connection.query(
                    `INSERT IGNORE INTO bookings (user_id, resource_id, date, time_slot) 
                     VALUES (?, ?, ?, ?)`,
                    [userId, resourceId, date, timeSlot],
                    (err, results) => {
                        if (err && !err.message.includes('Duplicate')) {
                            errors.push(err);
                        } else if (results && results.affectedRows > 0) {
                            insertedCount++;
                        }
                        
                        completed++;
                        
                        if (completed === sampleBookings.length) {
                            if (errors.length > 0) {
                                reject(errors[0]);
                            } else {
                                console.log(`✅ ${insertedCount} sample bookings inserted`);
                                this.showSampleData().then(resolve).catch(reject);
                            }
                        }
                    }
                );
            });
        });
    }

    showSampleData() {
        return new Promise((resolve, reject) => {
            this.connection.query(
                'SELECT * FROM bookings ORDER BY date, time_slot',
                (err, bookings) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('\n📊 Sample data in bookings table:');
                        console.log('┌────┬─────────┬─────────────┬────────────┬──────────┬─────────────────────┐');
                        console.log('│ ID │ User ID │ Resource ID │ Date       │ Time Slot│ Created At          │');
                        console.log('├────┼─────────┼─────────────┼────────────┼──────────┼─────────────────────┤');
                        bookings.forEach(booking => {
                            const createdAt = booking.created_at 
                                ? booking.created_at.toISOString().slice(0, 19).replace('T', ' ')
                                : 'NULL';
                            console.log(`│ ${booking.id.toString().padEnd(2)} │ ${booking.user_id.toString().padEnd(7)} │ ${booking.resource_id.toString().padEnd(11)} │ ${booking.date} │ ${booking.time_slot} │ ${createdAt} │`);
                        });
                        console.log('└────┴─────────┴─────────────┴────────────┴──────────┴─────────────────────┘');
                        resolve();
                    }
                }
            );
        });
    }

    closeConnection() {
        if (this.connection) {
            this.connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

// Run the launcher if this file is executed directly
if (require.main === module) {
    const launcher = new DatabaseLauncher();
    launcher.launch();
}

module.exports = DatabaseLauncher;