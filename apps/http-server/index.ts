import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import authRouter from "./routes/auth.routes"
import orgRouter from "./routes/organisation.routes"
import errorHandler from "utils/ErrorHandler"
import docRouter from "./routes/docs.routes"
import genaiRouter from "./routes/genai.route"
const app = express()


app.use(cors({
    origin:['http://localhost:5173'],
    credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.use("/api/health",(req,res)=>res.json({"test":"Hi from server"}))
app.use("/api/auth" , authRouter)
app.use("/api/org" , orgRouter)
app.use("/api/doc" , docRouter)
app.use("/api/genai" , genaiRouter )



app.use(errorHandler)
 
app.listen(3001,()=>{
    console.log("App is running on port 3001")
})