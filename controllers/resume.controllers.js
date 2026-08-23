import { ApiResponse } from "../utils/ApiResponse.js";
import Resume from "../models/resume.model.js";
import ApiError from "../utils/ApiError.js";
import { Education } from "../models/education.model.js";
import {asyncHandler} from "../utils/asyncHandler.js";

const createResume = asyncHandler(async(req, res, next) => {
     //1. user should be logged in or signed in
     //2. user should be able to create only one resume
     //3. user should add all the details in the resume
     //4. user should select the template for the resume
     //5. all the data should get saved in the database
     //6. response should be sent to the user with the resume details
    const userId = req.user._id;
    const existingResumeCount = await Resume.countDocuments({owner: userId})
    if(existingResumeCount >= 1){
        throw new ApiError(403, "Free plan limit reached. You can only create one resume")
    }
    
    const {
        template, 
        summary, // Root level summary
        personalInfo, 
        education, // Array of education objects from frontend
        isFresher, 
        experience, 
        skills, 
        projects, 
        certifications, 
        languages, 
        achievements, 
        isPublic
    } = req.body;

    //validate required fields
    if(!(personalInfo.fullName && personalInfo.email && personalInfo.phone && personalInfo.location)){
        throw new ApiError(400, "Missing required personal information fields")
    }

    if(!skills || skills.trim() === ""){
        throw new ApiError(400, "Skills field is required")
    }

    if(!education || !Array.isArray(education) || education.length === 0){
        throw new ApiError(400, "At least one education entry is required")
    }
    
    const createdEducations = await Education.insertMany(education)//adding multiple education entries to the database
    const educationIds = createdEducations.map(edu => edu._id)//extracting the ids of the created education entries

    const newResume = new Resume({
        owner: userId,
        template: template || "classic-ats",
        summary: summary || "",
        personalInfo,
        education: educationIds,
        isFresher: isFresher || false,
        experience: experience || [],
        skills,
        projects: projects || [],
        certifications: certifications || [],
        languages: languages || [],
        achievements: achievements || [],
        isPublic: isPublic || false
    })

    const populatedResume = await newResume.populate("education")//populating the education field with the actual education documents
    if(!populatedResume){
        throw new ApiError(500, "Failed to create resume")
    }

    res.status(201).json(new ApiResponse(200, "Resume created successfully", populatedResume))
    
})



export {
    createResume
}