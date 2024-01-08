const { Router } = require("express");
const driverRouter = Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const {driverBlackListingModel}=require("../Models/blackListing.driverModel")
const { driverModel } = require("../Models/driver.model");
// const { validatePassword } = require("../validation");
const {driverAuthMiddleware}=require("../Middlewares/driver.auth.middleware");
const { passengerModel } = require("../Models/passenger.model");
driverRouter.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phoneNumber,
      carLicensePlate,
      carModel,
      location,
    } = req.body;
    // if (!validatePassword(password)) {
    //   return res.status(200).send({ msg: "Not strong password" });
    // }
    bcrypt.hash(password, 5, async (err, hashed) => {
      try {
        if (err) {
          res.status(400).send({ err });
        } else {
          console.log(hashed);
          const driver = await driverModel.create({
            name,
            email,
            password: hashed,
            phoneNumber,
            carLicensePlate,
            carModel,
            location
          });
          console.log(driver);
          return res.status(200).json({ msg: driver });
        }
      } catch (err) {
        res.send({ err: err.message });
      }
    });
  } catch (err) {
    res.status(400).send({ err: err.message });
  }
});
driverRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const driver = await driverModel.findOne({ email });
    if (driver) {
      console.log(driver);
      bcrypt.compare(password, driver.password, (err, result) => {
        if (err) {
          res.status(200).send({ msg: "wrong password" });
        } else {
          console.log(result);
          const token = jwt.sign(
            { userId: driver._id, user: driver.name,location:driver.location},
            "masai",
            { expiresIn: "7d" }
          );
          return res.status(200).json({ msg: "Logged in successfully", token });
        }
      });
    } else {
      res.status(200).send({ msg: "User doesn't exist" });
    }
  } catch (err) {
    res.status(400).send({ msg: err.message });
  }
});

  // for accepting passenger request
  driverRouter.post('/accept-request/:passengerId',driverAuthMiddleware,async(req,res)=>{
    try{
      const{passengerId}=req.params
   console.log(passengerId,req.userId)
    const passenger=await passengerModel.updateOne({_id:passengerId},{$set:{driverId:req.userId}})
    return res.status(201).json({passenger,msg:'request accepted and driverId is present'})
    }catch(err){
      res.status(402).send({err:err.message})
    }
  })
  //logout
  driverRouter.get("/logout",async(req,res)=>{
    try{
      const token=req.headers.authorization
      if(token){
       const driverToken_blackListing= await driverBlackListingModel.create({token})
       console.log(driverToken_blackListing)
       return res.status(200).json({msg:"logged-out successfully",token})
      }
    }catch(err){
      res.status(400).send({msg:err.message})
    }
  })
  
module.exports = { driverRouter };
