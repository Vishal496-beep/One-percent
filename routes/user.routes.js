import { loginUser, registerUser, logoutUser, refreshAccessToken } from "../controllers/user.controllers.js";
import {Router} from "express"
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }
    ]),
    registerUser)
router.route("/login").post(loginUser)
//secured routes

router.route("/logout").post(verifyJWT,logoutUser)
router.route("/refresh-token").post( refreshAccessToken)  //this route is used to refresh the access token using the refresh token

export default router