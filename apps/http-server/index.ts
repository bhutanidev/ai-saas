import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import authRouter from "./routes/auth.routes"
import orgRouter from "./routes/organisation.routes"
import errorHandler from "utils/ErrorHandler"
import docRouter from "./routes/docs.routes"
const app = express()



app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.use("/api/auth" , authRouter)
app.use("/api/org" , orgRouter)
app.use("/api/doc" , docRouter)


app.use(errorHandler)
 
app.listen(3001,()=>{
    console.log("App is running on port 3001")
})