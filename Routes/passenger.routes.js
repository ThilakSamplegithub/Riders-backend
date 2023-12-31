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
const { driverModel } = require("../Models/driver.model");
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
          return res.status(200).json({ msg: `logged-in successfully`, token,id:user._id });
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

//passenger makes request 
passengerRouter.patch("/update/request/:id",authMiddleware,async(req,res)=>{
  try{
      // const {id}=req.params
      const{id}=req.params
      console.log(id)
      const{location}=req.body
      if(req.userId===id){
        const passenger=await passengerModel.findOne({_id:id})
        if(passenger){
           const updatedRequest=await passengerModel.updateOne({_id:req.userId},{$set:{location}})
           console.log(updatedRequest)
           const nearBydrivers=await driverModel.find({location})
           return res.status(200).json({msg:"Request sent",id:req.userId,pickup:location,nearBydrivers})
        }
      }else{
        return res.status(201).json({msg:`please login again`})
      }
  }catch(err){
     res.status(400).send({msg:err.message})
  }
})
//After driver accepted this will be useful to get drivers id
passengerRouter.get("/",authMiddleware,async(req,res)=>{
  try{
    console.log(req.userId,'is id of passenger')
    const passenger=await passengerModel.find({_id:req.userId})
    return res.status(201).json({passenger})
  }catch(err){
    res.status(400).send({err:err.message})
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
