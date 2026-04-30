import dotenv from "dotenv"
import connectDB from "../db/index.js"
dotenv.config({
    path:'./.env'
})

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(` Server is running on Port: ${process.env.PORT}`)
    })
    app.on('ERROR',(err) => {
      console.log('ERRRR',err)
      throw err
    })
})
.catch((err) => {
    console.log('MONGODB CONNECTION FAILED!!!',err)
})







// (async()=>{
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI},${DB_NAME}`)
//     } catch (error) {
//         console.log("error",error)
//         throw error
//     }
// })()