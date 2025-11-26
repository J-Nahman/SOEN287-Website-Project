// launch-database-fixed.js
const mysql = require('mysql');
const fs = require('fs');
const path = require('path');

class DatabaseLauncher {
    constructor() {
        this.config = {
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: '', // Empty password
            multipleStatements: true
        };
        this.connection = null;
    }

    async launch() {
        console.log('🚀 Starting Database Launcher...\n');
        
        try {
            await this.connectToMySQL();
            await this.selectDatabase(); // Select database first
            await this.runSQLFile('login.sql');
            console.log('\n✅ Database setup completed successfully!');
        } catch (error) {
            console.error('\n❌ Database setup failed:', error.message);
        } finally {
            this.closeConnection();
        }
    }

    connectToMySQL() {
        return new Promise((resolve, reject) => {
            console.log('🔌 Connecting to MySQL server...');
            
            this.connection = mysql.createConnection(this.config);
            
            this.connection.connect((err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('✅ Connected to MySQL server');
                    resolve();
                }
            });
        });
    }

    selectDatabase() {
        return new Promise((resolve, reject) => {
            console.log('📂 Selecting database: login');
            
            this.connection.query('USE login', (err) => {
                if (err) {
                    console.log('⚠️ Database does not exist, it will be created by the SQL file');
                    // Don't reject here - the SQL file will create the database
                }
                resolve();
            });
        });
    }

    runSQLFile(filename) {
        return new Promise((resolve, reject) => {
            console.log(`📦 Running SQL file: ${filename}`);
            
            const filePath = path.join(__dirname, filename);
            
            if (!fs.existsSync(filePath)) {
                reject(new Error(`SQL file not found: ${filePath}`));
                return;
            }

            const sqlContent = fs.readFileSync(filePath, 'utf8');
            
            console.log('📄 SQL file content loaded, executing...');
            
            this.connection.query(sqlContent, (err, results) => {
                if (err) {
                    console.error('❌ SQL execution error:', err.message);
                    reject(err);
                } else {
                    console.log('✅ SQL file executed successfully');
                    console.log('📊 Query results:', results);
                    resolve(results);
                }
            });
        });
    }

    closeConnection() {
        if (this.connection) {
            this.connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the launcher
const launcher = new DatabaseLauncher();
launcher.launch();