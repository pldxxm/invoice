const Customer = require("../lib/models/customer.model");
const { body, validationResult } = require("express-validator");
const Invoice = require("../lib/models/invoice.model");

const validateCustomer = [
  body("name", "Name must not be empty").notEmpty(),
  body("email", "Email must not be empty").notEmpty(),
  body("phone", "Phone must not be empty").notEmpty(),
  body("address", "Address must not be empty").notEmpty(),
];

const showCustomers = async (req, res) => {
  try {
    const query = buildCustomerQuery(req);
    const { page, limit, skip } = getPaginationParams(req);
    const { customers, totalCustomers, pagination } =
      await executeCustomerQuery(query, page, limit, skip);

    res.render("pages/customers", {
      title: "Customers",
      type: "data",
      customers,
      totalCustomers,
      ...pagination,
      search: req.query.search || "",
      info: req.flash("info")[0],
      // errors: req.flash("errors") || [],
    });
  } catch (error) {
    if (error.message === "Invalid pagination parameters") {
      req.flash("info", {
        message: "Invalid pagination parameters",
        type: "error",
      });
      return res.redirect("/api/customers");
    }
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const getFilteredCustomers = async (req, res) => {
  try {
    const query = buildCustomerQuery(req);
    const { page, limit, skip } = getPaginationParams(req);
    const { customers, totalCustomers, pagination } =
      await executeCustomerQuery(query, page, limit, skip);

    res.json({
      customers,
      totalCustomers,
      ...pagination,
      search: req.query.search || "",
    });
  } catch (error) {
    if (error.message === "Invalid pagination parameters") {
      req.flash("info", {
        message: "Invalid pagination parameters",
        type: "error",
      });
      return res.redirect("/api/customers");
    }
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

const buildCustomerQuery = (req) => {
  const query = { owner: req.session.userId };
  const { search } = req.query;

  if (search) {
    query["$or"] = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { address: { $regex: search, $options: "i" } },
    ];
  }

  return query;
};

const getPaginationParams = (req) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  // exclude invalid page and limit values
  if (page < 1 || limit < 1 || limit > 100) {
    throw new Error("Invalid pagination parameters");
  }

  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

const executeCustomerQuery = async (query, page, limit, skip) => {
  const [customers, totalCustomers] = await Promise.all([
    Customer.find(query).skip(skip).limit(limit),
    Customer.countDocuments(query),
  ]);

  const totalPages = Math.ceil(totalCustomers / limit);

  if (page > totalPages) {
    page = totalPages;
  }

  skip = (page - 1) * limit;

  return {
    customers,
    totalCustomers,
    pagination: {
      currentPage: page,
      totalPages: totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      limit: limit,
    },
  };
};

const getCreateCustomer = async (req, res) => {
  res.render("pages/customers", {
    title: "Create Customer",
    formAction: "create",
    type: "form",
    customer: req.flash("formData")[0] || {},
    errors: req.flash("errors") || [],
  });
};

const createCustomer = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash("errors", errors.array());
      req.flash("formData", req.body);
      return res.redirect("create");
    }
    req.body.owner = req.session.userId;
    const newCustomer = new Customer(req.body);
    await Customer.create(newCustomer);
    req.flash("info", {
      message: "Customer created successfully",
      type: "success",
    });
    res.redirect("/api/customers");
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const editCustomer = async (req, res) => {
  const customerId = req.params.id;
  const customer = await Customer.findById(customerId);
  res.render("pages/customers", {
    title: "Edit Customer",
    type: "form",
    formAction: "edit",
    customer: req.flash("data")[0] || customer,
    errors: req.flash("errors"),
  });
};

const updateCustomer = async (req, res) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    const errors = validationErrors.array();
    req.flash("errors", errors);
    req.flash("data", req.body);
    return res.redirect("edit");
  }
  const customerId = req.params.id;
  const customerData = req.body;
  await Customer.findByIdAndUpdate(customerId, customerData);
  req.flash("info", {
    message: "Customer Updated",
    type: "success",
  });
  res.redirect("/api/customers");
};

const deleteCustomer = async (req, res) => {
  const customerId = req.params.id;
  try {
    await Invoice.deleteMany({ customer: customerId });
    await Customer.findByIdAndDelete(customerId);
    req.flash("info", {
      message: "Customer and related invoices Deleted",
      type: "success",
    });
    res.redirect("/api/customers");
  } catch (error) {
    req.flash("errors", {
      message: "Customer Deletion Failed",
      type: "error",
    });
    res.redirect("/api/customers");
  }
};

module.exports = {
  getCreateCustomer,
  createCustomer,
  showCustomers,
  editCustomer,
  updateCustomer,
  validateCustomer,
  deleteCustomer,
  getFilteredCustomers,
};
