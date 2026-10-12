import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js"
import {Test} from "../models/test.model.js";
import {ApiResponse} from "../utils/ApiResponse.js"

let ai = new GeminiGenAi({apiKey: process.env.GEMINI_API_KEY, model: "gemini-1.5"})
const createTest = asyncHandler(async(req, res) => {
   const {name, description, questions} = req.body
   
})