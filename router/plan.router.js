import { Router } from "express";
import { createPlan, getPlans } from "../controller/PlanController.js";

const planrouter = Router();

planrouter.post("/create-plans", createPlan);
planrouter.get("/get-plans", getPlans);

export default planrouter;