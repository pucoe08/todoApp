import express from "express";
import cookieParser from "cookie-parser";
import User from "./routes/user.js"
import fileUpload from "express-fileupload";
export const app=express();
import cors from "cors";
// cors: cross origin resource sharing used to send data from one url to other


app.use(cors());

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use(fileUpload({
    limits:{fileSize:50*1024*1024},
    useTempFiles:true,
}))
app.use("/api/v1",User); 

app.get("/",(req,res)=>{
    res.send("To do App Server Working");
})