import { Router } from "express";
import { getDocRequirements, saveDocRequirements } from "../controller/documentsController.js";

const documentsRouter = Router()

documentsRouter.post("/save-doc-requirements", saveDocRequirements); 
documentsRouter.get("/get-doc-requirements", getDocRequirements);


export default documentsRouter

