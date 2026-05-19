import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import jwt from "jsonwebtoken"
import {User} from "../models/User.js"

export const verifyJWT = asyncHandler(async (req, _, next) => {
    // Get token from header
    // Verify token
    // Attach user to request object
   try {
     const token = req.cokkies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
     if(!token){
         throw new ApiError(401, "Unauthorized, token not found")
     }
 
     const decodedToken =jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)

     const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
     if(!user){
         throw new ApiError(404, "Invalid access token")
     }
     req.user = user
     next()
   } catch (error) {
       throw new ApiError(401, error?.message || "Invalid access token")
   }
})