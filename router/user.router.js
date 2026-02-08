import { Router } from "express";
import { creatUser, getAllUser, userDetails, verifyUser } from "../controller/user.controller.js";
import {authToken} from "../middleware/authToken.js"


const userrouter = Router();

userrouter.post("/create-user",creatUser)
userrouter.post("/verify-user",verifyUser)
userrouter.get("/get-userDetails",authToken,userDetails)
userrouter.get("/all-users", authToken, getAllUser)

export default userrouter;