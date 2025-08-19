const Customer = require('../lib/models/customer.model');
const { body, validationResult } = require('express-validator');
const Invoice = require('../lib/models/invoice.model');

const validateCustomer = [
    body('name', 'Name must not be empty').notEmpty(),
    body('email', 'Email must not be empty').notEmpty(),
    body('phone', 'Phone must not be empty').notEmpty(),
    body('address', 'Address must not be empty').notEmpty(),
   ];


const showCustomers = async (req, res) => {
  const query = { owner: req.session.userId };
  const {search} = req.query;
  if (search) {
    query["$or"] = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { address: { $regex: search, $options: "i" } },
    ];
  }
  const customers = await Customer.find(query);
  res.render("pages/customers", {
    title: "Customers",
    type: "data",
    customers,
    info: req.flash("info")[0],
    errors: req.flash("errors") || [],
  });
};

const getCreateCustomer = async (req, res) => {
    res.render('pages/customers', {
        title: 'Create Customer',
        formAction: 'create',
        type: 'form',
        customer: req.flash('formData')[0]||{},
        errors: req.flash('errors')||[],
    });
};

const createCustomer = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            req.flash('errors', errors.array());
            req.flash('formData', req.body);
            return res.redirect('create');
        }
        req.body.owner = req.session.userId;
        const newCustomer = new Customer(req.body);
        await Customer.create(newCustomer);
        req.flash('info', {
            message: 'Customer created successfully',
            type: 'success'
        });
        res.redirect('/api/customers');
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const editCustomer = async (req, res) => {
    const customerId = req.params.id;
    const customer = await Customer.findById(customerId);
    res.render('pages/customers', {
    title: 'Edit Customer',
    type: 'form',
    formAction: 'edit',
    customer: req.flash('data')[0] || customer,
    errors: req.flash('errors'),
    });
    };

const updateCustomer = async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
        const errors = validationErrors.array();
        req.flash('errors', errors);
        req.flash('data', req.body);
        return res.redirect('edit');
    }
    const customerId = req.params.id;
    const customerData = req.body;
    await Customer.findByIdAndUpdate(customerId, customerData);
    req.flash('info', {
        message: 'Customer Updated',
        type: 'success'
    });
    res.redirect('/api/customers');
    };

const deleteCustomer = async (req, res) => {
    const customerId = req.params.id
    try {
    await Invoice.deleteMany({customer: customerId});
    await Customer.findByIdAndDelete(customerId);
    req.flash('info', {
        message: 'Customer and related invoices Deleted',
        type: 'success'
    });
    res.redirect('/api/customers');
}
catch (error) {
    req.flash('errors', {
        message: 'Customer Deletion Failed',
        type: 'error'
    });
    res.redirect('/api/customers');
}
    };

module.exports = { getCreateCustomer,createCustomer,showCustomers,editCustomer,updateCustomer,validateCustomer,deleteCustomer };