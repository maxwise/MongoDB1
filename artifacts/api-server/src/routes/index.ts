import { Router, type IRouter } from "express";
import healthRouter from "./health";
import personRouter from "./person";

const router: IRouter = Router();

// Mount the health-check route
router.use(healthRouter);

// Mount all Person CRUD and query routes
router.use(personRouter);

export default router;
