const express = require("express");
const router = express.Router();
const { verifyUser } = require("../lib/middleware");
const {
  getCreateInvoice,
  createInvoice,
  showInvoices,
  getFilteredInvoices,
  validateInvoice,
  getEditInvoice,
  updateInvoice,
  deleteInvoice,
  getCustomers,
} = require("../controllers/invoice.controller");

router.get("/", verifyUser, showInvoices);
router.get("/query", verifyUser, getFilteredInvoices);
router.get("/create", [verifyUser, getCustomers], getCreateInvoice);
router.post("/create", [verifyUser, validateInvoice], createInvoice);
router.get("/:id/edit", [verifyUser, getCustomers], getEditInvoice);
router.post("/:id/edit", [verifyUser, validateInvoice], updateInvoice);
router.post("/:id/delete", verifyUser, deleteInvoice);

module.exports = router;
