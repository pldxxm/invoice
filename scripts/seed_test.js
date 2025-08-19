const mongoose = require("mongoose");
require("dotenv").config();

const User = require("../lib/models/user.model");
const Customer = require("../lib/models/customer.model");
const Invoice = require("../lib/models/invoice.model");
const bcrypt = require("bcrypt");

function formatUSDate(date) {
  const d = new Date(date);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is not set");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  // use the current user as the owner
  const ownerEmail = "1790236881@qq.com";
  const owner = await User.findOne({ email: ownerEmail });
  if (!owner) {
    console.error("Current user not found");
    process.exit(1);
  }

  // Create 50 customers with more diverse names
  const customers = [];
  const customerNames = [
    "Acme Corporation",
    "Tech Solutions Inc",
    "Global Industries",
    "Innovation Labs",
    "Digital Dynamics",
    "Future Systems",
    "Smart Solutions",
    "Elite Enterprises",
    "Peak Performance",
    "Summit Services",
    "Pinnacle Partners",
    "Crest Consulting",
    "Horizon Holdings",
    "Vista Ventures",
    "Apex Associates",
    "Zenith Zone",
    "Prime Partners",
    "Premier Products",
    "Select Services",
    "Choice Consulting",
    "Optimal Operations",
    "Strategic Solutions",
    "Tactical Tech",
    "Precision Partners",
    "Exact Enterprises",
    "Accurate Associates",
    "Reliable Resources",
    "Trusted Tech",
    "Secure Solutions",
    "Safe Systems",
    "Protected Partners",
    "Guarded Groups",
    "Shield Services",
    "Defense Dynamics",
    "Security Systems",
    "Guardian Groups",
    "Watchdog Works",
    "Monitor Masters",
    "Oversight Operations",
    "Supervision Services",
    "Management Masters",
    "Leadership Labs",
    "Direction Dynamics",
    "Guidance Groups",
    "Steering Services",
    "Navigation Networks",
    "Pilot Partners",
    "Captain Consulting",
    "Commander Corps",
    "General Groups",
    "Admiral Associates",
    "Marshal Masters",
  ];

  for (let i = 0; i < 50; i++) {
    const name = customerNames[i];
    const email = `customer${i + 1}@example.com`;
    const phone = `555-${String(i + 1).padStart(3, "0")}`;
    const address = `${100 + i} ${
      ["Main St", "Oak Ave", "Pine Rd", "Elm Blvd", "Maple Dr"][i % 5]
    }, ${
      [
        "New York",
        "Los Angeles",
        "Chicago",
        "Houston",
        "Phoenix",
        "Philadelphia",
        "San Antonio",
        "San Diego",
        "Dallas",
        "San Jose",
      ][i % 10]
    }`;

    const existing = await Customer.findOne({ email });
    const customer =
      existing ||
      (await Customer.create({
        name,
        email,
        phone,
        address,
        owner: owner._id,
      }));
    customers.push(customer);
  }
  console.log(`Ensured ${customers.length} customers`);

  // Create 300 invoices with dates spanning 6+ months
  const statuses = ["paid", "pending"];
  const amounts = [
    50, 75, 100, 125, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800,
    900, 1000, 1200, 1500, 2000,
  ];

  // Calculate date range: 6 months ago to 1 month in the future
  const today = new Date();
  const sixMonthsAgo = new Date(today);
  sixMonthsAgo.setMonth(today.getMonth() - 6);

  const oneMonthFuture = new Date(today);
  oneMonthFuture.setMonth(today.getMonth() + 1);

  const totalDays = Math.floor(
    (oneMonthFuture - sixMonthsAgo) / (1000 * 60 * 60 * 24)
  );

  const invoicesToInsert = [];
  for (let i = 0; i < 300; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const amount = amounts[Math.floor(Math.random() * amounts.length)];

    // Generate random date within the 6+ month range
    const randomDays = Math.floor(Math.random() * totalDays);
    const date = new Date(sixMonthsAgo);
    date.setDate(date.getDate() + randomDays);

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
  console.log(`Inserted ${invoicesToInsert.length} invoices`);
  console.log(
    `Date range: ${formatUSDate(sixMonthsAgo)} to ${formatUSDate(
      oneMonthFuture
    )}`
  );
  console.log(`Total days covered: ${totalDays} days`);

  await mongoose.disconnect();
  console.log("Done");
}

main().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch (e) {}
  process.exit(1);
});
