import { Router } from "express";
import { getSearchResults } from "../controller/search.controller.js";

const router = Router();


router.get("/", getSearchResults);
export default router