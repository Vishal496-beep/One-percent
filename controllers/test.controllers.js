import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js"
import {Test} from "../models/test.model.js";
import {Resume} from "../models/resume.model.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {generateGeminiJsonResponse} from "../src/services/ai.service.js"

let ai = new GeminiGenAi({apiKey: process.env.GEMINI_API_KEY, model: "gemini-1.5"})

const generateTest = asyncHandler(async(req, res) => {
   const userId = req.user?._id
   const {resumeId} = req.params;

   if (!userId) {
      throw new ApiError(401, "Unauthorized user not found")
   }
   
   const resume = await Resume.findOne({_id: resumeId, owner: userId}).populate("education")
   if (!resume) {
      throw new ApiError(404, "Resume not found")
   }

   const previousTestCounts = await Test.countDocuments({resume: resumeId, owner:userId})
   if(previousTestCounts >= 3){
      throw new ApiError(400, "You have exceded the limit of requests for generating tests. Please buy a premium plan to generate more tests.")
   }
   
   const prompt = [
      {
         role: "system",
         content: `You are an expert technical interviewer. Analyze the following candidate resume data and generate a rigorous technical and project-based test consisting of 35 multiple-choice questions. 
         Focus heavily on their declared skills, projects, tech stack, or any field which are listed on the resume (e.g., MERN, JavaScript, Node.js, React).
         you have to give a score and analysis by creating a report from 1 to 100 score . Also you have to give suggesstions to the candidate that which areas are most important to cover and focus on for their career growth. The test should be challenging and cover a wide range of topics relevant to the candidate's experience and skills.
         you must give candidate the best resource where they can follow and learn how would it improve for that search widely and platform names.
         

         Resume Data:
       - Summary: ${resume.summary}
       - Skills: ${resume.skills}
       - Projects: ${JSON.stringify(resume.projects)}

        You MUST return ONLY a valid JSON array of objects. No markdown formatting blocks around it if possible, or standard JSON. Each object must strictly follow this structure:
       {
        "question": "The question text here",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswerIndex": 0, // Index of the correct option (0 to 3)
        "type": "Project-Based" // or "core-Subject"
       }`
         
      }
   ]

   const questionList = await generateGeminiJsonResponse(prompt)
   
   const newTest = new Test.create({
      owner: userId,
        resume: resumeId,
        subject: resume.skills.split(",")[0] || "General",
        questions: questionList,
        score: 0,
        isPassed: false,
        improvementAreas: {
            weakAreas: [],
            actionableAreas: [],
            recommendedResources: []
        }
   })

   return res
   .status(201)
   .json(
      new ApiResponse(
         newTest,
         "Test generated successfully"
      )
   )

})