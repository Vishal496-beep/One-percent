import mongoose, {Schema} from "mongoose";
const experienceSchema = new Schema(
    {
        type : {
            type: String,
            enum: ["Full-time", "Part-time", "Internship", "Freelance", "Apprenticeship"],
            default: "Full-time",
        },
        company: {
            type: String,
            trim: true
        },
        position: {
            type: String,
            required: true,
            trim: true
        },
        startDate: {
            type: Date,
            required: true
        },
        endDate: {
            type: Date
        },
        description: {
            type: String,
            trim: true
        }
    }
)
const resumeSchema = new Schema(
    {
        owner : {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        template: {
            type: String,
            enum:  ["classic-ats", "modern-ats", "creative-ats"] 
        },
        summary: {
            type:String,
            trim: true
        },
        personalInfo: {
            fullName: {
                type: String,
                required: true,
                trim: true
            },
            email: {
                type: String,
                required: true,
                trim: true
            },
            phone: {
                type: String,
                required: true,
            },
            location: {
                type: String,
                required: true,
                trim: true
            },
            linkedin: {
                type: String
            },
            github: {
                type: String
            },
            portfolio: {
                type: String
            },
            summary: {
                type: String,
                required: true,
                trim: true
            }
        },
        education: [{
           type: mongoose.Schema.Types.ObjectId,
           ref: "Education",
           required: true
        }],
        isFresher: {
            type: Boolean,
            default: false
        },
        experience: [experienceSchema],
        skills: {
            type: String,
            required: true,
            trim: true
        },
        projects: [
              {
                title:{type: String, required:true, trim: true },
                description:{type: String, required:true, trim: true },
                link:{type: String, trim: true },
                technologies: [{type: String, trim: true }],
                githubLink: {type: String, trim: true }
        }
        ],
        certifications: [
            {
                title:{type: String, required:true, trim: true },
                isuueDate:{type: Date, required:true },
                issuer:{type: String, required:true, trim: true },
                credentialId:{type: String, trim: true },
            }
        ],
        languages: [
            {
                name:{type: String, required:true, trim: true },
                proficiency:{enum: ["Beginner", "Intermediate", "Advanced", "Fluent", "Native"], required:true },     
            }
        ],
        achievements: [{
            type: String,
        }],
        isPublic: {
            type: Boolean,
            default: false
        }
    }, {timestamps: true}
)

