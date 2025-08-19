const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../lib/models/user.model');
const Customer = require('../lib/models/customer.model');
const Invoice = require('../lib/models/invoice.model');
const bcrypt = require('bcrypt');

function formatUSDate(date) {
	const d = new Date(date);
	return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

async function main() {
	if (!process.env.MONGODB_URI) {
		console.error('MONGODB_URI is not set');
		process.exit(1);
	}

	await mongoose.connect(process.env.MONGODB_URI);
	console.log('Connected to MongoDB');

	// use the current user as the owner
	const ownerEmail = '1790236881@qq.com';
	const owner = await User.findOne({ email: ownerEmail });
	if (!owner) {
		console.error('Current user not found');
		process.exit(1);
	}

	// Create 10 customers
	const customers = [];
	for (let i = 1; i <= 10; i++) {
		const name = `Customer ${i}`;
		const email = `customer${i}@example.com`;
		const phone = `555-010${String(i).padStart(2, '0')}`;
		const address = `${100 + i} Main St, City`;
		const existing = await Customer.findOne({ email });
		const customer =
			existing ||
			(await Customer.create({ name, email, phone, address, owner: owner._id }));
		customers.push(customer);
	}
	console.log(`Ensured ${customers.length} customers`);

	// Create 50 invoices
	const statuses = ['paid', 'pending'];
	const invoicesToInsert = [];
	for (let i = 0; i < 50; i++) {
		const customer = customers[Math.floor(Math.random() * customers.length)];
		const amount = Number((Math.random() * 1000 + 50).toFixed(2));
		const daysOffset = Math.floor(Math.random() * 60) - 30; // within +/- 30 days
		const date = new Date();
		date.setDate(date.getDate() + daysOffset);
		const status = statuses[Math.floor(Math.random() * statuses.length)];

		invoicesToInsert.push({
			amount,
			date: formatUSDate(date),
			status,
			owner: owner._id,
			customer: customer._id,
		});
	}

	await Invoice.insertMany(invoicesToInsert);
	console.log('Inserted 50 invoices');

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


