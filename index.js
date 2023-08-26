const express=require("express")
const {connection}=require("./config/db")
require('dotenv').config()
const {passengerRouter}=require("./Routes/passenger.routes")
const cors=require("cors")
const app=express()
app.use(express.json())
app.get("/",(req,res)=>{
    res.setHeader("Content-Type","text/html")
    res.send(`<h1>Welcome</h1>`)
})
app.use("/passenger",passengerRouter)
app.listen(8080,async()=>{
try{
    await connection
    console.log(`port ${process.env.PORT} is running`)
}catch(err){
    console.log(err.message)
}
})