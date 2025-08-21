const { Schema, model } = require("mongoose");
const Customer = require("./customer.model");
const InvoiceSchema = new Schema({
  amount: { type: Number, required: true },
  date: { type: String, required: true },
  status: { type: String, required: true },
  owner: { type: Schema.Types.ObjectId, ref: "User" },
  customer: { type: Schema.Types.ObjectId, ref: "Customer" },
});

// 输入分页信息，获取invocies
InvoiceSchema.statics.getPaginatedInvoices = async function (
  owner,
  page = 1,
  limit = 10,
  search = ""
) {
  const skip = (page - 1) * limit;
  const query = { owner };
  return this.find(query).skip(skip).limit(limit).withCustomer(search);
};

// 定义一个Invoice模型的帮助函数，用于填充customer字段
InvoiceSchema.query.withCustomer = function (search = " ") {
  // 构造填充选项
  const options = {
    path: "customer",
    model: Customer,
    select: "_id name",
  };
  if (search !== "") {
    options.match = { name: { $regex: search, $options: "i" } };
  }
  return this.populate(options);
};

module.exports = model("Invoice", InvoiceSchema);
