const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../lib/models/user.model');
const Customer = require('../lib/models/customer.model');
const Invoice = require('../lib/models/invoice.model');

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGODB_URI is not set');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const seedEmail = process.env.SEED_EMAIL || 'seeduser@example.com';
  const owner = await User.findOne({ email: seedEmail });

  if (owner) {
    const ownerId = owner._id;
    const invRes = await Invoice.deleteMany({ owner: ownerId });
    const custRes = await Customer.deleteMany({ owner: ownerId });
    const userRes = await User.deleteOne({ _id: ownerId });
    console.log(`Deleted invoices: ${invRes.deletedCount}`);
    console.log(`Deleted customers: ${custRes.deletedCount}`);
    console.log(`Deleted user: ${userRes.deletedCount}`);
  } else {
    console.warn(`Seed user not found for ${seedEmail}. Falling back to customer email pattern cleanup.`);
    const pattern = /^customer\d+@example\.com$/i;
    const customers = await Customer.find({ email: { $regex: pattern } });
    if (customers.length) {
      const ids = customers.map(c => c._id);
      const invRes = await Invoice.deleteMany({ customer: { $in: ids } });
      const custRes = await Customer.deleteMany({ _id: { $in: ids } });
      console.log(`Deleted invoices (by customer set): ${invRes.deletedCount}`);
      console.log(`Deleted customers (by email pattern): ${custRes.deletedCount}`);
    } else {
      console.log('No matching test customers found to delete.');
    }
  }

  await mongoose.disconnect();
  console.log('Done');
}

main().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch (e) {}
  process.exit(1);
});


