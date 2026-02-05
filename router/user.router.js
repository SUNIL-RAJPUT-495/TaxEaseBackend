import { Router } from "express";
import { creatUser, verifyUser } from "../controller/user.controller.js";

const userrouter = Router();

userrouter.post("/create-user",creatUser)
userrouter.post("/verify-user",verifyUser)

export default userrouter;