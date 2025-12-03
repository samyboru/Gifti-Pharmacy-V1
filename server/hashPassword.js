// File Location: server/hashPassword.js

const bcrypt = require('bcryptjs');

// --- CHOOSE YOUR ADMIN PASSWORD HERE ---
const myPassword = 'admin1234'; // This is the password you will use to log in

async function generateHash() {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(myPassword, salt);
  console.log('--- COPY THE ENTIRE HASH STRING BELOW ---');
  console.log(hash);
  console.log('--- END OF HASH ---');
}

generateHash();