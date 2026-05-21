import mongoose,{Schema} from 'mongoose';

const followSchema = new Schema({
    following:{
        //the one who is initiating the following
        type:Schema.Types.ObjectId,
        ref:'User',
    },
    channel:{
        //the one whom is being followed
        type:Schema.Types.ObjectId,
        ref:'User',
    }
},{timestamps:true})

//to make sure that a user can follow another user only once we use indexing with unique constraint
followSchema.index({following:1,channel:1},{unique:true})
export const Follow = mongoose.model('Follow',followSchema)