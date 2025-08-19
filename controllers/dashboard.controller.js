const Customer = require("../lib/models/customer.model");
const Invoice = require("../lib/models/invoice.model");
const { USDollar } = require("../lib/formatter");
const { getLatestInvoices } = require("./invoice.controller");

const showDashboard = async (req, res) => {
  //get cutsomer number
  const owner = req.session.userId;
  const customerCount = await Customer.countDocuments({ owner });
  // get invoice number
  const invoiceCount = await Invoice.countDocuments({ owner });
  const allInvocies = await Invoice.find({ owner }).populate({
    path: "customer",
    model: Customer,
    select: "_id name",
  });
  // get total amount of paid invoices
  const totalPaid = allInvocies.reduce((acc, invoice) => {
    return invoice.status === "paid" ? acc + invoice.amount : acc;
  }, 0);

  // get total amount of unpaid invoices
  const totalPending = allInvocies.reduce((acc, invoice) => {
    return invoice.status === "pending" ? acc + invoice.amount : acc;
  }, 0);

  const revenueData = [];
  for (let i = 0; i < 6; i++) {
    const today = new Date();
    today.setMonth(today.getMonth() - i);
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const month = today.toLocaleString("default", { month: "short" });
    const revenueForMonth = allInvocies
      .filter((invoice) => {
        return (
          new Date(invoice.date) >= firstDay &&
          new Date(invoice.date) <= lastDay
        );
      })
      .reduce((total, invoice) => total + invoice.amount, 0);
    revenueData.unshift({ month, revenue: revenueForMonth });
  }

  const latestInvoices = await getLatestInvoices(req);

  res.render("pages/dashboard", {
    title: "Dashboard",
    revenueData: JSON.stringify(revenueData),
    customerCount,
    invoiceCount,
    totalPaid,
    totalPending,
    USDollar,
    latestInvoices,
  });
};

module.exports = {
  showDashboard,
};
