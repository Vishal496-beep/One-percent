import mongoose,{Schema} from "mongoose";
const questionAnswerSchema = new Schema({
    question: { 
        type: String, 
        required: true 
    },
    category: { 
    type: String, 
    enum: ["Behavioral", "Technical", "System Design", "Project-Deep-Dive"],
    default: "Technical" 
  },
  userAnswer: { 
    type: String, 
    default: "" },
  feedback: {
    score: { 
        type: Number, 
        min: 0, 
        max: 100
     },
    strengths: [String],
    improvements: [String],
    sampleAnswer: { type: String }
  }
})
const  interviewSchema = new Schema({
    owner: { 
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
     },
    resume: { 
        type: Schema.Types.ObjectId,
        ref: "Resume",
        required: true
 },
    jobTitle: {
        type: String, 
        required: true
     }, 
    experienceLevel: { 
        type: String, 
        enum: ["Junior", "Mid-Level", "Senior"],
        default: "Junior" 
     },
    status: { 
        type: String, 
        enum: ["pending", "in-progress", "completed"], 
        default: "pending"
     },
    questions: [questionAnswerSchema],
    overallScore: {
         type: Number, 
         default: 0 },
    overallFeedback: {
      summary: { 
        type: String 
      },
      technicalRating: { 
        type: Number, 
        min: 1,
        max: 10
      },
      communicationRating: { 
        type: Number,
        min: 1,
        max: 10
      },
      keyStrengths: [String],
      keyWeaknesses: [String],
    }
},{timestamps: true}
)

export const Interview = mongoose.model("Interview", interviewSchema)