import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import guestsRouter from "./guests";
import chatRouter from "./chat";
import hotelRouter from "./hotel";
import trackingRouter from "./tracking";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(guestsRouter);
router.use(chatRouter);
router.use(hotelRouter);
router.use(trackingRouter);

export default router;
