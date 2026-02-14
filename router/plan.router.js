import { Router } from "express";
import { createPlan, deletePlan, editPlan, getAllServices, getPlans } from "../controller/PlanController.js";
import { authToken } from "../middleware/authToken.js";

const planrouter = Router();

planrouter.post("/create-plans", createPlan);
planrouter.get("/get-plans", getPlans);
planrouter.get("/getAllServices",getAllServices)
planrouter.put("/editPlan",editPlan)
planrouter.delete("/deletePlan",authToken,deletePlan)

export default planrouter;