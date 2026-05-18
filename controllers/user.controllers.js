import {asyncHandler} from "../utils/asyncHandler.js";
import {User} from "../models/user.model.js";
import {ApiError} from "../utils/ApiError.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAceessAndRefreshTokens = async (userId) => {
   try {
     const user  = await User.findById(userId)
     const accessToken = user.generateAccessToken()
     const refreshToken = user.generateRefreshToken()
     user.refreshToken = refreshToken
     user.save({validateBeforeSave: false})
      return {accessToken, refreshToken}
   } catch (error) {
      throw new ApiError(500, "something went wrong while generating tokens")
   }
}

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
            $or:[{ email }, {username: username.toLowerCase() }]
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

const loginUser = asyncHandler(async(req,res) => {
    // Validate input / req.body -> data le aao
    // Generate tokens / access token and refresh token
    // send cookies / refresh token in httpOnly cookie and access token in response body
    // Return response

      const {email, username, password} = req.body
      if(!username || !password){
        throw new ApiError(400, "Username and password are required")
      }
    // Check if user exists  
   // email ya username se user ko find karo
      const user = await User.findOne({
        $or: [{email}, {username}]
      })
      if(!user){
        throw new ApiError(404, "User not found")
      }
   // Compare password  / bcrypt se password compare karo
      const isPasswordValid = await user.isPasswordCorrect(password)
      if(!isPasswordValid){
        throw new ApiError(401, "Invalid user credentials")
      }
   // Generate tokens / access token and refresh token
     const {accessToken, refreshToken} = await generateAceessAndRefreshTokens(user._id)
    
     const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
   // Send cookies / refresh token in httpOnly cookie and access token in response body
    
   const cookieOptions = {
    httpOnly: true,
    secure: true// Set secure flag in production
   }

   return res
   .status(200)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .cookie("accessToken", accessToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user,
          accessToken,
          refreshToken,
          loggedInUser
        },
        "User logged in successfully"
      )
    )
})

const logoutUser = asyncHandler(async(req,res) => {
    // Clear cookies / refresh token and access token
    // Return response
    

})





export {
    registerUser,
    loginUser,
    logoutUser
}