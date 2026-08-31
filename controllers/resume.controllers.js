import { ApiResponse } from "../utils/ApiResponse.js";
import { Resume } from "../models/resume.model.js";
import {ApiError} from "../utils/ApiError.js";
import { Education } from "../models/education.model.js";
import {asyncHandler} from "../utils/asyncHandler.js";

const createResume = asyncHandler(async(req, res) => {
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
    if(!personalInfo?.fullName || !personalInfo?.email || !personalInfo?.phone || !personalInfo?.location){
        throw new ApiError(400, "Missing required personal information fields")
    }

    const isSkillEmpty = !skills || (typeof skills === "string" && skills.trim() === "") || (Array.isArray(skills) && skills.length === 0)
    
    if(isSkillEmpty){
        throw new ApiError(400, "At least one skill is required")
    }
    
    if(!education || !Array.isArray(education) || education.length === 0){
        throw new ApiError(400, "At least one education entry is required")
    }

    let educationIds = []

    try {
        const createdEducations = await Education.insertMany(education)//adding multiple education entries to the database
        educationIds = createdEducations.map(edu => edu._id)//extracting the ids of the created education entries

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
      
    await newResume.save()//saving the resume to the database
    await newResume.populate("education")//populating the education field with the actual education documents
    if(!newResume){
        throw new ApiError(500, "Failed to create resume")
    }

    res.status(201).json(new ApiResponse(200, newResume, "Resume created successfully"))
  } catch (error) {
    //rollback all education entries if resume fails to create
    if (educationIds.length > 0){
    await Education.deleteMany({
        _id: { $in: educationIds}
    })
}
    throw new ApiError(
        error.statusCode || 500, 
        error.message || "Failed to create resume"
    )
  }
    
})


const getUserResume = asyncHandler(async(req, res) => {
      const resume = await Resume.findOne({owner: req.user?._id}).sort("-updatedAt").populate("education")
      if(!resume){
        throw new ApiError(404, "Resume not found")
      }
      return res.status(200).json(new ApiResponse(200, resume, "Resume fetched successfully"))
})

const getResumeById = asyncHandler(async(req,res) => {
     //1. user should be logged in or signed in
     //2. user should be able to get the resume by id
     //3. user should be able to get the resume by id only if it is public or if the user is the owner of the resume
     //4. response should be sent to the user with the resume details
     //5. if the resume is not found, return 404 error
    
    const {resumeId} = req.params
    const resume = await Resume.findOne(
        {_id: resumeId,
            $or: [{
               isPublic: true
            },
              {owner: req.user?._id}
        ]
         })


    if(!resume){
        throw new ApiError(404, "Resume not found or you do not have permission to view it")
    }
    
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        resume,
        "Resume fetched successfully"
    ))

})

const updateResume = asyncHandler(async(req, res) => {
    //1. user should be logged in or signed in
    //2. user should be able to update the resume by id
    //3. user should be able to update the resume by id only if the user is the owner of the resume
    //4. response should be sent to the user with the updated resume details
    //5. if the resume is not found, return 404 error
    //6. if the user is not the owner of the resume, return 403 error
    const userId = req.user?._id  // Get the user ID from the request object
    const {id: resumeId} = req.params

    //user should be loggedin
    if(!userId){
        throw new ApiError(401, "User not authenticated")
    }

    const resume = await Resume.findById(resumeId)
    if(!resume) throw new ApiError(404, "Resume not found")

    if(resume.owner.toString() !== userId.toString()){
        throw new ApiError(403, "You do not have permission to update this resume")
    }

    // Update the resume with the new data from the request body like skills, education experience etc...
    const updatedResume = await Resume.findByIdAndUpdate(
        resumeId,
        { 
            $set: req.body
        },
        {
            new: true, // Returns the modified document
            runValidators: true // Triggers Schema validation on updates
        }
    )
    if(!updatedResume) throw new ApiError(500, "Failed to update resume")
    
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedResume,
            "Resume updated successfully"
        )
    )
})


const deleteResume = asyncHandler(async(req,res) => {
    const userId = req.user?._id  // Get the user ID from the request object
    const {id: resumeId} = req.params
    if(!userId) throw new ApiError(401, "User not authenticated")
    const deletedResume = await Resume.findOneAndDelete({_id: resumeId, owner:userId})
    if(!deletedResume){
     throw new ApiError(404, "Resume not found or you do not have permission to delete it")
    }
    
    if (deletedResume.education && deletedResume.education.length > 0) {
        await Education.deleteMany({ _id: { $in: deletedResume.education } });
    }

    await deletedResume.deleteOne();
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            deletedResume,
            "Resume deleted successfully"
        )
    )
    
})

const duplicateResume = asyncHandler(async(req, res) => {
    //1. user should be logged in or signed in
    //2. user should be able to duplicate the resume by id
    //3. user should be able to duplicate the resume by id only if the user is the owner of the resume
    //4. response should be sent to the user with the duplicated resume details
    const userId = req.user?._id  // Get the user ID from the request object
    const {id: resumeId} = req.params

    const original = await Resume.findOne({ _id: resumeId, owner: req.user?._id})
    if(!original){
        throw new ApiError(404, "Resume not found or you do not have permission to duplicate it")
    }

    //create a new resume with the same data as the original
    const duplicateData = original.toObject();

    delete duplicateData._id //remove the _id field to create a new document
    delete duplicateData.createdAt //remove the createdAt field to create a new document
    delete duplicateData.updatedAt //remove the updatedAt field to create a new document

    const newEducationIds = []
    if(Array.isArray(duplicateData.education) && duplicateData.education.length > 0){
        const cleanEducationList = duplicateData.education.map(({_id, createdAt, updatedAt, ...rest}) => rest)
        const newEducation = await Education.insertMany(cleanEducationList)
        newEducationIds = newEducation.map((edu) => edu._id)
    }

    duplicateData.education = newEducationIds
    const subDocumentsArrays = ['experience', 'projects', 'certifications', 'languages', ]
    subDocumentsArrays.forEach((key) => {
        if(Array.isArray(duplicateData[key])){
            duplicateData[key] = duplicateData[key].map(({_id, ...rest}) => rest)
        }
    })
    const newResume = await Resume.create(duplicateData)
    await newResume.populate("education")

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            newResume,
            "Resume duplicated successfully"
        )

    )
})

const toggleResume = asyncHandler(async(req,res) => {
    const {resumeId} = req.params
    const resume = await Resume.findOne({id: resumeId, owner: req.user?._id})
    if(!resume) throw ApiError(401, "resume not found")
    
    resume.isPublic = !resume.isPublic
    await resume.save({validateBeforeUpdate: false})

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            {isPublic : resume.isPublic},
            `resume public status changed to ${resume.isPublic}`
        )
    )
})

const getPublicResume = asyncHandler(async(req, res) => {
    const {resumeId} = req.params
    const resume = await Resume.findOne({_id: resumeId, owner: req.user?._id})
    .select("-owner")
    .populate("education")

    if(!resume) throw ApiError(401, "Public resume not found, or it is set to private")
    
    return res
    .status(201)
    .json(new ApiResponse(
        201,
        resume,
        "Public resume fetched successfully"
    ))

})

export {
    createResume,
    getUserResume,
    getResumeById,
    updateResume,
    deleteResume,
    duplicateResume,
    toggleResume,
    getPublicResume
}
