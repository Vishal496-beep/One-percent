import {asyncHandler} from "../utils/asyncHandler.js";
import {User} from "../models/user.model.js";
import {ApiError} from "../utils/ApiError.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";


const registerUser = asyncHandler(async (req, res) => {
    // Validate input
       const {fullname, email, password,username} = req.body
          if(
            [fullname,email,password,username].some((field) => field.trim() === "" )
          ){
            throw new ApiError(400, "All fields are required")
          }
          console.log(req.body)
    // Check if user already exists
          const existingUser = await User.findOne({
            $or:[{ email }, {username}]
          })
          console.log(existingUser)
    //if user exists, throw error
          if(existingUser){
            throw new ApiError(409, "User with this email or username already exists")
          }
          console.log(req.files)
    // Handle avatar upload also currently file is in or local path, we will move it to cloud storage and get the URL
          const avatarLocalPath = req.files?.avatar[0]?.path
            console.log(avatarLocalPath)
          if(!avatarLocalPath){
            throw new ApiError(400, "Avatar file is required")
          }
    // Upload avatar to cloud storage and get the URL / cloudinary
         
          let avatar = await uploadOnCloudinary(avatarLocalPath)
          if(!avatar){
            throw new ApiError(400, "something went wrong while uploading avatar")
          }
    // Create new user
          const user = await User.create({
            fullname,
            email,
            password,
            username: username.toLowerCase(),
            avatar: avatar.secure_url
          })
          const createdUser = await User.findById(user._id).select("-password -refreshToken")
          if(!createdUser){
            throw new ApiError(500, "something went wrong while creating user")
          }
    
    // Return success response
     return res
     .status(201)
     .json(new ApiResponse(201, createdUser, "User registered successfully"))
})










export {
    registerUser
}