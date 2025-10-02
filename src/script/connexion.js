const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function verifyLogin(nom, motDePasse) {
  const connection = await mysql.createConnection({
    host: 'mysql-bargicloud.alwaysdata.net',
    user: '413421_dedicadev',
    database: 'bargicloud_dedica_dev',
    password: 'dedicadev2025'
  });

  const [rows] = await connection.execute(
    'SELECT * FROM utilisateurs WHERE nom = ?',
    [nom]
  );

  if (rows.length === 0) return false;
  const user = rows[0];

  const isValid = await bcrypt.compare(motDePasse, user.mot_de_passe);
  return isValid ? user : false;
}

module.exports = { verifyLogin };