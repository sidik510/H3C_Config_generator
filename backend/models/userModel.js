const db = require('../config/db');

function createUser(name, email, hashedPassword, role, callback) {
  const sql = 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)';
  db.query(sql, [name, email, hashedPassword, role], (err, result) => {
    if (err) return callback(err);
    callback(null, result);
  });
}

function findUserByEmail(email, callback) {
  const sql = 'SELECT * FROM users WHERE email = ? LIMIT 1';
  db.query(sql, [email], (err, results) => {
    if (err) return callback(err, null);
    callback(null, results[0]);
  });
}

module.exports = {
  createUser,
  findUserByEmail
};
