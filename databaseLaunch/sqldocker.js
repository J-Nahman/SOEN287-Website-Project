const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class MySQLDocker {
    constructor() {
        this.containerName = 'booking-mysql';
        this.port = 3306;
    }

    async start() {
        try {
            console.log('🐳 Starting MySQL with Docker...');
            
            // Check if Docker is installed
            try {
                await execPromise('docker --version');
            } catch (error) {
                console.log('❌ Docker is not installed or not running');
                console.log('💡 Install Docker from: https://docker.com/get-started');
                return;
            }

            // Check if container already exists and is running
            const status = await this.getContainerStatus();
            
            if (status === 'running') {
                console.log('✅ MySQL container is already running');
                return true;
            }

            if (status === 'stopped') {
                console.log('🔄 Starting existing container...');
                await execPromise(`docker start ${this.containerName}`);
            } else {
                console.log('📦 Creating new MySQL container...');
                const { stdout } = await execPromise(
                    `docker run --name ${this.containerName} \
                     -e MYSQL_ROOT_PASSWORD=password \
                     -e MYSQL_DATABASE=booking_system \
                     -p ${this.port}:3306 \
                     -d mysql:8.0 \
                     --default-authentication-plugin=mysql_native_password`
                );
                console.log('✅ Container created:', stdout);
            }

            console.log('⏳ Waiting for MySQL to start (15-30 seconds)...');
            await this.waitForMySQL();
            
            console.log(`🎉 MySQL is ready on localhost:${this.port}`);
            console.log('\n📋 Connection details:');
            console.log('   Host: localhost');
            console.log('   Port: 3306');
            console.log('   User: root');
            console.log('   Password: password');
            console.log('   Database: booking_system');
            
            return true;
            
        } catch (error) {
            console.error('❌ Error:', error.message);
            return false;
        }
    }

    async getContainerStatus() {
        try {
            const { stdout } = await execPromise(`docker ps -a -f name=${this.containerName} --format "{{.Status}}"`);
            if (stdout.includes('Up')) return 'running';
            if (stdout.trim()) return 'stopped';
            return 'not exists';
        } catch (error) {
            return 'not exists';
        }
    }

    async waitForMySQL(maxAttempts = 30) {
        const mysql = require('mysql');
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            process.stdout.write(`⏰ Waiting for MySQL... (${attempt}/${maxAttempts})\r`);
            
            const connection = mysql.createConnection({
                host: 'localhost',
                port: this.port,
                user: 'root',
                password: 'password',
                connectTimeout: 2000
            });

            try {
                await new Promise((resolve, reject) => {
                    connection.connect((err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
                
                connection.end();
                console.log('\n✅ MySQL is ready!');
                return;
            } catch (error) {
                // Ignore connection errors during startup
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        throw new Error('MySQL failed to start within expected time');
    }

    async stop() {
        try {
            console.log('🛑 Stopping MySQL container...');
            await execPromise(`docker stop ${this.containerName}`);
            console.log('✅ MySQL container stopped');
        } catch (error) {
            console.error('Error stopping container:', error.message);
        }
    }
}

// Run if executed directly
if (require.main === module) {
    const dockerMySQL = new MySQLDocker();
    dockerMySQL.start().then(success => {
        if (success) {
            console.log('\n🚀 Now run: node create-database.js');
        }
    });
}

module.exports = MySQLDocker;