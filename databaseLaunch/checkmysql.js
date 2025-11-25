const mysql = require('mysql');
const net = require('net');

console.log('🔍 Diagnosing MySQL Connection Issues...\n');

// Check if port 3306 is open
function checkPort(host, port) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        const timeout = 3000;
        
        socket.setTimeout(timeout);
        socket.on('connect', () => {
            socket.destroy();
            resolve(true);
        });
        socket.on('timeout', () => {
            socket.destroy();
            resolve(false);
        });
        socket.on('error', () => {
            resolve(false);
        });
        
        socket.connect(port, host);
    });
}

async function diagnose() {
    console.log('1. Checking if MySQL port 3306 is accessible...');
    const portOpen = await checkPort('localhost', 3306);
    
    if (portOpen) {
        console.log(' Port 3306 is open - MySQL might be running');
        
        // Try to connect with MySQL
        const connection = mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: 'password',
            connectTimeout: 5000
        });

        connection.connect((err) => {
            if (err) {
                console.log(' MySQL is running but connection failed:');
                console.log('   Error:', err.message);
                console.log('\n Possible solutions:');
                console.log('   - Wrong password? Try empty password or "password"');
                console.log('   - Check if MySQL service is properly started');
            } else {
                console.log(' Successfully connected to MySQL!');
                connection.end();
            }
        });

        connection.on('error', (err) => {
            console.log(' MySQL connection error:', err.message);
        });

    } else {
        console.log(' Port 3306 is closed - MySQL is not running');
        console.log('\n Choose a solution below:');
        console.log('   1. Start MySQL Service (if installed)');
        console.log('   2. Install MySQL with Docker (recommended)');
        console.log('   3. Install MySQL directly');
    }
}

diagnose();