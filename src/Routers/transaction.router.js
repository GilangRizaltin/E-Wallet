const express = require("express");

const transactionRouter = express.Router();
const { getHistory, transactionChart, getDashboardData, deleteTransaction, postTransfer } = require("../Handlers/transaction.handler");
const { isLogin } = require("../Middlewares/authorization");

transactionRouter.get("/:userid", isLogin, getHistory);
transactionRouter.get("/chart/:userid", isLogin, transactionChart);
transactionRouter.get("/dashboard/:userid", isLogin, getDashboardData);
transactionRouter.delete("/:transactionId", isLogin, deleteTransaction);
transactionRouter.post("/transfer", isLogin, postTransfer);

module.exports = transactionRouter;
