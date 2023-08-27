const { Router } = require("express");
const {passengerBlackListingModel}=require("../Models/blackListing.passengerModel")
const bcrypt = require("bcrypt");
const { passengerModel } = require("../Models/passenger.model");
const { authMiddleware } = require("../Middlewares/auth.middleware");
const jwt = require("jsonwebtoken");
const upload = require("../Middlewares/multer.middleware");
const passengerRouter = Router();
const {validatePassword}=require("../validation");
const { driverAuthMiddleware } = require("../Middlewares/driver.auth.middleware");
passengerRouter.post("/register", async (req, res) => {
  try {
    const { name, email, password, gender, phoneNumber, profilePicture,location } =
      req.body;
    if (!validatePassword(password)) {
      return res.status(200).send("Not a strong Password");
    }
    bcrypt.hash(password, 6, async (err, hashed) => {
      try {
        if (err) {
          res.status(201).send(`please register again`);
        } else {
          console.log(hashed);
          const passenger = await passengerModel.create({
            name,
            email,
            password: hashed,
            gender,
            phoneNumber,
            profilePicture,
            location
          });
          return res.status(201).json({ passenger });
        }
      } catch (err) {
        res.status(400).send(err.message);
      }
    });
  } catch (err) {
    res.status(400).send({ err: err.message });
  }
});
passengerRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await passengerModel.findOne({ email });
    console.log(user);
    if (email) {
      bcrypt.compare(password, user.password, (err, result) => {
        if (err) {
          res.status(200).send({ msg: "Wrong Password" });
        } else {
          console.log(result);
          const token = jwt.sign(
            { userId: user._id, user: user.name },
            "masai"
          );
          return res.status(200).json({ msg: `logged-in successfully`, token });
        }
      });
    }
  } catch (err) {
    res.status(401).send({ msg: err.message });
  }
});
// This end point is to upload image
passengerRouter.patch(
  "/update/profile/:id",
  authMiddleware,
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      const { id } = req.params;
      console.log(id);
      const user = await passengerModel.findOne({ _id: id });
      console.log(user);
      if (!user) {
        res.status(200).send({ msg: "user doesn't exist" });
      } else {
        if (String(user._id) === req.userId) {
          console.log(req);
          if (!req.file) {
            return res.status(400).json({ message: "No file provided" });
          }

          const profilePicturePath = req.file.path; // Store this path in the database or use it as needed
          const profile = await passengerModel.updateOne(
            { _id: id },
            { $set: { profilePicture: profilePicturePath } }
          );
          console.log(profile);
          return res
            .status(200)
            .json({ msg: `${req.user} uploaded successfully` });
        } else {
          res.status(200).send({ msg: "You are not authorized" });
        }
      }
    } catch (err) {
      res.status(400).send({ err: err.message });
    }
  }
);
passengerRouter.patch("/update/location/:id",authMiddleware,async(req,res)=>{
     try{
         const {id}=req.params
         const passenger=await passengerModel.findOne({_id:id})
       if(passenger&&id===req.userId){
          const updatedLocation=await passengerModel.updateOne({_id:id},{$set:req.body})
          console.log(updatedLocation)
          return res.status(200).json({msg:"updated location"})
       }
     }catch(err){
        res.status(400).send({msg:err.message})
     }
})
//passenger makes request 
passengerRouter.patch("/update/request/:id",authMiddleware,async(req,res)=>{
  try{
      const {id}=req.params
      const passenger=await passengerModel.findOne({_id:id})
    if(passenger&&id===req.userId){
       const updatedRequest=await passengerModel.updateOne({_id:id},{$set:{request:true}})
       console.log(updatedRequest)
       return res.status(200).json({msg:"Request sent"})
    }
  }catch(err){
     res.status(400).send({msg:err.message})
  }
})
// get all those passengers who made request to particular location 
passengerRouter.get("/",driverAuthMiddleware,async(req,res)=>{
 try{
  // console.log(req.query)
  const location=req.location
  console.log(location,"is location")
  // const matchedLocations=new RegExp(location,"i")// To make queries insensitive
  const user=await passengerModel.findOne({location})
  console.log(user,"are users")
  if(user?.location){
    const allPassengers=await passengerModel.find({$and:[{location},{request:true}]})
    return res.status(200).json({data:allPassengers})
  }else{
    return res.status(200).json({msg:`No such location exists`})
  }
 }catch(err){
  res.status(400).send({msg:err.message})
 }
})
// passenger gets confirmation of driver to get a ride
passengerRouter.patch("/update/getDriverId/:id",driverAuthMiddleware,async(req,res)=>{
  try{
    const{id}=req.params
    console.log(id)
  const passenger= await passengerModel.find({$and:[{_id:id},{location:req.location}]})
  console.log(passenger,"is passenger")
  if(passenger[0].request&&passenger){
  console.log(passenger)
  const updatedDriverId=await passengerModel.updateOne({_id:id},{$set:{driverId:req.userId}})
  console.log(updatedDriverId)
  return res.status(200).json({msg:"userId of Driver is attached"})
  }else{
    res.status(200).send({msg:`Passenger doesn't exist or didn't made request`})
  }
  }catch(err){
    res.status(400).send({msg:err.message})
  }
  })
  // display paricular driver
  passengerRouter.get("/showDriver",authMiddleware,async(req,res)=>{
try{
   const passenger= await passengerModel.findOne({_id:req.userId})
   console.log(passenger)
   if(passenger.driverId){
    const allData= await passengerModel.findOne({_id:String(req.userId)}).populate("driverId")
   return res.status(200).json({data:allData.driverId})
   }else{
    res.status(200).send({msg:`Not yet confirmed`})
   }
}catch(err){
  res.status(200).send({err:err.message})
}
  })
  // logout
  passengerRouter.get("/logout",async(req,res)=>{
    try{
      const token=req.headers.authorization
      if(token){
       const passengerToken_blackListing= await passengerBlackListingModel.create({token})
       console.log(passengerToken_blackListing)
       return res.status(200).json({msg:"logged-out successfully",token})
      }
    }catch(err){
      res.status(400).send({msg:err.message})
    }
  })
module.exports = { passengerRouter };
