import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import storageRouter from "./storage";
import projectsRouter from "./projects";
import expensesRouter from "./expenses";
import auditRouter from "./audit";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(storageRouter);
router.use(projectsRouter);
router.use(expensesRouter);
router.use(auditRouter);
router.use(dashboardRouter);

export default router;
