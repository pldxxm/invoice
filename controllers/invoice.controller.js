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


// create a hepler funciton to fetch invoices data ,use both for render function and api function 
const fetchInvoicesData = async (owner, page, limit, search) => {
  const [list, total] = await Promise.all([
    Invoice.getPaginatedInvoices(owner, page, limit, search),
    Invoice.countDocuments({ owner }),
  ]);
  const invoices = (list || []).filter((inv) => inv && inv.customer);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    invoices,
    totalInvoices: total,
    pageMeta: {
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      limit,
    },
  };
}


// render function for invoices page
const showInvoices = async (req, res) => {
  try {
    const owner = req.session.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const {invoices, totalInvoices, pageMeta} = await fetchInvoicesData(owner, page, limit, search);

    res.render("pages/invoices", {
      title: "Invoices",
      type: "data",
      invoices: invoices,
      totalInvoices: totalInvoices,
      ...pageMeta,
      search: search,
      USDollar,
      info: req.flash("info")[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// api to get filtered invoices
const getFilteredInvoices = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || "";
  const owner = req.session.userId;
  try {
    if (page < 1 || limit < 1 || limit > 100) {
      throw new Error("Invalid pagination parameters");
    }
    const data = await fetchInvoicesData(owner, page, limit, search);

    return res.json(data);
  } catch (error) {
    if (error.message === "Invalid pagination parameters") {
      req.flash("info", {
        message: "Invalid pagination parameters",
        type: "error",
      });
      return res.redirect("/api/invoices");
    }
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// const populateInvoices = async (query, search) => {
//   const options = {
//     path: "customer",
//     model: Customer,
//     select: "_id name",
//   };
//   if (search) {
//     options.match = { name: { $regex: search, $options: "i" } };
//   }

//   let populated;
//   // Real mongoose query: has populate() that returns a thenable
//   if (query && typeof query.populate === "function") {
//     populated = await query.populate(options);
//   } else {
//     // Tests may pass an array directly
//     populated = Array.isArray(query) ? query : [];
//   }

//   return populated.filter((inv) => inv && inv.customer != null);
// };

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
  getFilteredInvoices,
  getCreateInvoice,
  getCustomers,
  createInvoice,
  validateInvoice,
  getEditInvoice,
  updateInvoice,
  deleteInvoice,
  getLatestInvoices,
};
