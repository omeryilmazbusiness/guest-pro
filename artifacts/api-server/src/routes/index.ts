import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import guestsRouter from "./guests";
import chatRouter from "./chat";
import hotelRouter from "./hotel";
import trackingRouter from "./tracking";
import requestsRouter from "./requests";
import analyticsRouter from "./analytics";
import welcomeAlertRouter from "./welcome-alert";
import staffRouter from "./staff";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(guestsRouter);
router.use(chatRouter);
router.use(hotelRouter);
router.use(trackingRouter);
router.use(requestsRouter);
router.use(analyticsRouter);
router.use(welcomeAlertRouter);
router.use(staffRouter);

export default router;
