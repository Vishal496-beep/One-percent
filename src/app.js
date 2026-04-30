import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}))
app.use(express.json('20kb'))  //form ka data bhot aa skta h toh isliye its better ki hum ek limit ser krde 
app.use(express.urlencoded({extended: true, limit:'20kb'})) //information hume url se bhi chahiye hogi isliye ye lgaya h so that ki waha se bhi hum data fetch kr paye
app.use(express.static("public")) //static isliye kyuki kai baar folder/img/pdf hume save krne hote h apne server par 
app.use(cookieParser())
export {app}