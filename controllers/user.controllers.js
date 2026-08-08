import {asyncHandler} from "../utils/asyncHandler.js";
import {User} from "../models/user.model.js";
import {ApiError} from "../utils/ApiError.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
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
      if(!(username || password)){
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
    await User.findByIdAndUpdate(
      req.user._id,
      {
        refreshToken: undefined
      },
      {
        new: true
      }
    )

    const cookieOptions = {
      httpOnly: true,
      secure: true
    }
    return res
    .status(200)
    .clearCookie("refreshToken", cookieOptions)
    .clearCookie("accessToken", cookieOptions)
    .json(
      new 
      ApiResponse(200, {}, "User logged out successfully")
    )
})

const refreshAccessToken = asyncHandler(async(req,res) => {
    // Get refresh token from cookies
    // Validate refresh token
    // Generate new access token
    // Send new access token in response body
    // Return response
       const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
        if(!incomingRefreshToken){
          throw new ApiError(400, "unauathorized request, refresh token is missing")
        }

       try {
         const decodedToken = jwt.verify(
           incomingRefreshToken,
           process.env.REFRESH_TOKEN_SECRET
         )
 
         const user = await User.findById(decodedToken?._id)
         if(!user){
           throw new ApiError(401, " invalid refresh token")
         }
         if(incomingRefreshToken !== user?.refreshToken){
           throw new ApiError(401, "refresh token is expired or used")
         }
 
         const options = {
           httpOnly: true,
           secure: true
         }
 
         const {accessToken, newRefreshToken} = await generateAceessAndRefreshTokens(user._id)
         return res
         .status(200)
         .cookie("refreshToken", newRefreshToken, options)
         .cookie("accessToken", accessToken, options)
         .json(
           new ApiResponse(
             200,
             {
               accessToken,
               refreshToken: newRefreshToken
             },
             "Access token refreshed successfully"
           )
 )
       } catch (error) {
          throw new ApiError(401,error?.message || "Invalid or expired refresh token")
       }

})

const changeCurrentPassword = asyncHandler(async(req,res) => {
   // Get current password and new password from request body
   // Validate input
   // Check if current password is correct
   // Update password with new password
   // Return response
   const {oldPassword, newPassword} = req.body
   //find user in database
   const user = await User.findById(req.user?._id)
   //check if current password is correct
   const isPasswordValid = await user.isPasswordCorrect(oldPassword)
    if(!isPasswordValid){
      throw new ApiError(401, "Invalid current password")
    }
    //update password with new password
    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(
      new ApiResponse(200, {}, "Password changed successfully")
    )
})


const getCurrentUser = asyncHandler(async(req,res) => {
    return res
    .status(200)
    .json(
      new ApiResponse(200, req.user, "Current user details fetched successfully")
    )
})


const updateUserDetails = asyncHandler(async(req,res) => {
    // Get user details from request body
    // Validate input
    // Update user details in database
    // Return response
    const {fullname, email} = req.body
    if([fullname, email].some((field) => field.trim() === "")){
      throw new ApiError(400, "fullname and email are required")
    }

    //update user details in database
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set:{
          fullname,
          email
         }
      },
      {
        new: true
      }
    ).select("-password")

    if(!user){
        throw new ApiError(404, "User not found")
    }
    return res
    .status(200)
    .json(
      new ApiResponse(200, user, "User details updated successfully")
    )
})


const updateUserAvatar = asyncHandler(async(req,res) => {
    // Get avatar file from request
    // Validate input
    // Upload new avatar to cloud storage and get the URL
    // Update user avatar in database
    // Return response

    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath){
      throw new ApiError(400, "Avatar file is required")
    }
    // Upload new avatar to cloud storage and get the URL
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url){
      throw new ApiError(400,"something went wrong while uploading avatar")
    }

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set:{
          avatar: avatar.url
        }
      },
      {
        new: true
      }
    ).select("-password")
    //delete previous avatar from cloud storage if exists
      if(user?.avatar){
        const publicId = user.avatar.split("/").pop().split(".")[0]
        await deleteFromCloudinary(publicId)
      }
    return res
    .status(200)
    .json(
      new ApiResponse(200, user, "User avatar updated successfully")
    )
})


const deleteUserAccount = asyncHandler(async(req,res) => {
    // Delete user account from database
    // Clear cookies / refresh token and access token
    // Return response
    const user = await User.findById(req.user?._id)
    if(!user){
      throw new ApiError(404, "User not found")
    }
    const deletedUser = await User.findByIdAndDelete(req.user?._id)
    if(!deletedUser){
      throw new ApiError(404, "User not found")
    }
    const cookieOptions = {
      httpOnly: true,
      secure: true
    }
    return res
    .status(200)
    .clearCookie("refreshToken", cookieOptions)
    .clearCookie("accessToken", cookieOptions)
    .json(
      new ApiResponse(200, {}, "User account deleted successfully")
    )
})

const getUserChannelProfile = asyncHandler(async(req,res) => {
    // Get user details from database using userId from request params
    // Return response with user details
    const {username} = req.params
    if(!username?.trim()){
      throw new ApiError(400, "Username is required")
    }

    await User.aggregate([
       {
        $match: {
          username: username?.toLowerCase()
        }
       },
       {
        $lookup: {
          from: "follow",
          localField: "_id",
          foreignField: "user",
          as: "videos"
        }
       }
    ])

})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateUserDetails,
    getUserChannelProfile,
    deleteUserAccount,
}