import mongoose,{Schema} from "mongoose"
import jsonwebtoken from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema(
    {
       username:{
        type: String,
        required: [true, "username is required"],
        unique: true,
        lowercase: true,
        trim: true,
        index: true
       },
        email:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
       },
        fullname:{
        type: String,
        required: true,
        trim: true,
       },
        avatar:{
        type: String,
        required: true,
       },
       watchHistory: [
         {
           type: Schema.Types.ObjectId,
           ref : "Video"   
         }
       ],
       password: {
           type: String,
           required: [true, "Password is required"]

       },
       refreshToken: {
        type: String
       }
    },
    {timestamps: true}
)
userSchema.pre("save", async function(next){
    if(!this.isModified("password")) return next  //if password is not modified then return next cz if we dont use it then it will hash the password again and again when we update the user details
   this.password = await bcrypt.hash(this.password, 10)  //10 is the salt rounds which means how many times we want to hash the password
   next
})
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)  //compare the password with the hashed password in the database
}

userSchema.methods.generateAccessToken = function(){
    return jwt,sign({
        id: this._id,
        username: this.username,
        email: this.email,
        fullName: this.fullName
    }),
    process.env.ACCESS_TOKEN_SECRET,
    {
     expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
}
userSchema.methods.generateRefreshToken = function(){
    return jwt,sign({
        id: this._id,
    }),
    process.env.REFRESH_TOKEN_SECRET,
    {
     expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
}
export const User = mongoose.model("User", userSchema)