import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import vendorsRouter from "./vendors";
import bookingsRouter from "./bookings";
import reviewsRouter from "./reviews";
import savedRouter from "./saved";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(vendorsRouter);
router.use(bookingsRouter);
router.use(reviewsRouter);
router.use(savedRouter);

export default router;

