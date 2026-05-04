import { registerUser } from "../controllers/user.controllers.js";
import {Router} from "express"

const router = express.Router()

router.route("/register").post(registerUser)

export default router