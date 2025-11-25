const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (CSS, JS, images) from root
app.use(express.static(__dirname));

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'login'
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