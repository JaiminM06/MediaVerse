// require('dotenv').config({path:'./env'})
import dotenv from "dotenv"
import connectDB from "./db/index.js";

dotenv.config({
    path:'./env'
})

connectDB()






















/*
(async ()=>{
    try {
         await mongoose.connect(`${proccess.env.MONGODB_URI}/${DB_NAME}`)
         app.on("error",(error)=>{
            console.log(error)
         })

         app.listen(process.env.PORT,()=>{
            console.log(`${process.env.PORT}`)
         })
    } catch (error) {
        console.log("error",error)
        throw error
    }
})()
*/