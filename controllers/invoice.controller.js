const Invoice = require("../lib/models/invoice.model");
const Customer = require("../lib/models/customer.model");
const { body, validationResult } = require("express-validator");
const { USDollar } = require("../lib/formatter");

const validateInvoice = [
  body("customer", "Select the Customer").notEmpty(),
  body("amount", "Amount must not be empty").notEmpty(),
  body("date", "Due Date must not be empty").notEmpty(),
  body("status", "Select the Status").notEmpty(),
];

const showInvoices = async (req, res) => {
  const query = { owner: req.session.userId };
  const { search } = req.query;
  const invoices = await populateInvoices(Invoice.find(query), search);
  res.render("pages/invoices", {
    title: "Invoices",
    type: "data",
    invoices,
    USDollar,
    info: req.flash("info")[0],
  });
};

const populateInvoices = (query, search) => {
  const populatOptions = {
    path: "customer",
    model: Customer,
    select: "_id name",
  };
  if (search) {
    populatOptions.match = { name: { $regex: search, $options: "i" } };
  }
  return query
    .populate(populatOptions)
    .then((invoices) => invoices.filter((invoice) => invoice.customer != null));
};

const getCreateInvoice = async (req, res) => {
  res.render("pages/invoices", {
    title: "Create Invoice",
    formAction: "create",
    type: "form",
    invoice: req.flash("formData")[0] || {},
    errors: req.flash("errors") || [],
    customers: req.customers,
  });
};

const createInvoice = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash("errors", errors.array());
    req.flash("formData", req.body);
    return res.redirect("create");
  }
  try {
    const newInvoice = new Invoice(req.body);
    newInvoice.owner = req.session.userId;
    await Invoice.create(newInvoice);
    req.flash("info", {
      message: "Invoice created successfully",
      type: "success",
    });
    res.redirect("/api/invoices");
  } catch (error) {
    req.flash("errors", {
      message: "Invoice creation failed",
      type: "error",
    });
    req.flash("formData", req.body);
    return res.redirect("create");
  }
};

const getCustomers = async (req, res, next) => {
  const customersQuery = { owner: req.session.userId };
  const customers = await Customer.find(customersQuery);
  req.customers = customers;
  next();
};

const getEditInvoice = async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  res.render("pages/invoices", {
    title: "Edit Invoice",
    formAction: "edit",
    type: "form",
    invoice: req.flash("formData")[0] || invoice,
    errors: req.flash("errors") || [],
    customers: req.customers,
  });
};

const updateInvoice = async (req, res) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    const errors = validationErrors.array();
    req.flash("errors", errors);
    req.flash("formData", req.body);
    return res.redirect("edit");
  }
  try {
    const invoiceId = req.params.id;
    const invoiceData = req.body;
    await Invoice.findByIdAndUpdate(invoiceId, invoiceData);
    req.flash("info", {
      message: "Invoice updated successfully",
      type: "success",
    });
    res.redirect("/api/invoices");
  } catch (error) {
    req.flash("errors", {
      message: "Invoice update failed",
      type: "error",
    });
    req.flash("formData", req.body);
    return res.redirect("edit");
  }
};

const deleteInvoice = async (req, res) => {
  const invoiceId = req.params.id;
  await Invoice.findByIdAndDelete(invoiceId);
  req.flash("info", {
    message: "Invoice deleted successfully",
    type: "success",
  });
  res.redirect("/api/invoices");
};

const getLatestInvoices = async (req) => {
  const invoices = await Invoice.find({ owner: req.session.userId })
    .sort({ date: -1 })
    .limit(5)
    .populate({
      path: "customer",
      model: Customer,
      select: "_id name",
    });

  return invoices;
};

module.exports = {
  showInvoices,
  populateInvoices,
  getCreateInvoice,
  getCustomers,
  createInvoice,
  validateInvoice,
  getEditInvoice,
  updateInvoice,
  deleteInvoice,
  getLatestInvoices,
};
