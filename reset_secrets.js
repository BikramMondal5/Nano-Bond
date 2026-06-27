const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function resetSecrets() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    
    const users = await db.collection('users').find({}).toArray();
    let counter = 100000;
    
    for (const user of users) {
        counter++;
        const newSecret = counter.toString();
        const hashedSecret = await bcrypt.hash(newSecret, 12);
        
        await db.collection('users').updateOne(
            { _id: user._id },
            { $set: { secretKey: hashedSecret } }
        );
        console.log(`Email: ${user.email} -> New Secret Key: ${newSecret}`);
    }
    
    console.log('All users updated successfully.');
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
resetSecrets();
