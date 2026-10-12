import mongoose, {Schema} from "mongoose";

const questionSchema = new Schema(
    {
        question: {
            type: String,
            required: true
        },
        options: {
            type: [String],
            required: true
        },
        correctAnswerIndex: {
            type: Number,
            required: true
        },
        type: {
            type: String,
            enum:[
                "core-Subject",
                "Project-Based"
            ],
            required: true
        }
    }
)


const testSchema = new Schema({
      owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      resume: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Resume",
        required: true
      },
      subject: {  // Subject of the test means based on skillsof the user
        type: String,
        required: true
      },
      questions: [questionSchema],
      score: {
        type: Number,
        default: 0
      },
      passingScore: {
        type: Number,
        default: 70
      },
      isPassed: {
        type: Boolean,
        default: false
      },
      improvementAreas: {
        weakAreas: [String],
        actionableAreas: [String],
        recommendedResources: [String]
      }
}, {timestamps: true}
)

export const Test = mongoose.model("Test", testSchema)