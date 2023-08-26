const jwt=require("jsonwebtoken")
const authMiddleware=(req,res,next)=>{
    try{
        const token=req.headers.authorization
        if(token){
     jwt.verify(token,"masai",(err,decoded)=>{
        if(err){
            res.status(200).send(`You are not authorized`)
        }else{
            console.log(decoded)
            req.userId=decoded.userId
            req.user=decoded.user
            next()
        }
     })
        }else{
res.status(400).send("No Token")
        }
    }catch(err){
        res.status(400).send({err})
    }
    }
    module.exports={authMiddleware}
    