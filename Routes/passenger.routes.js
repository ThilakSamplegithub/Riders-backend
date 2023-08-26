const { Router } = require("express");
const bcrypt = require("bcrypt");
const { passengerModel } = require("../Models/passenger.model");
const { authMiddleware } = require("../Middlewares/auth.middleware");
const jwt = require("jsonwebtoken");
const upload = require("../Middlewares/multer.middleware");
const passengerRouter = Router();
function validatePassword(password) {
  if (!/[A-Z]/.test(password)) {
    return false;
  } else if (!/[a-z]/.test(password)) {
    return false;
  } else if (!/[0-9]/.test(password)) {
    return false;
  } else if (!/[!@#$%^&*()_+\-]/.test(password)) {
    // we can include = but after backslash only otherwise 
    // it will include range like - will also include range.
    // So \ is used to escape characters and turn them into regular character.
    return false;
  }
  return true;
}
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

module.exports = { passengerRouter };
