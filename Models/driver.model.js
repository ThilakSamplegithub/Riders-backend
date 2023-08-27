const mongoose=require("mongoose")
 const driverSchema= mongoose.Schema({
    name:{type:String,required:true},
    email:{type:String,required:true,unique:true},
    password:{type:String,required:true,min:6,max:15},
    phoneNumber:{type:String,required:true},
    carModel:{type:String,required:true},
    carLicensePlate: { type: String, required: true },
    location:{type:String,required:true},
    accept:{type:Boolean,default:false}
  },{versionKey:false})
   const driverModel= mongoose.model("Driver",driverSchema)
   module.exports={driverModel}