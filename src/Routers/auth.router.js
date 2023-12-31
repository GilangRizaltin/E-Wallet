const express = require("express");
const authRouter = express.Router();
const {registerUser, loginUser, activateUser, logOutUser, createPin, forgotPasswordUser, newPasswordUser} = require("../Handlers/auth.handler")
const {isLogin} = require("../Middlewares/authorization")

authRouter.post("/login", loginUser)
authRouter.post("/register", registerUser)
authRouter.post("/password", forgotPasswordUser)
authRouter.get("/", activateUser)
authRouter.patch("/password", newPasswordUser)
authRouter.patch("/",isLogin, createPin)
authRouter.delete("/", logOutUser)


module.exports = authRouter