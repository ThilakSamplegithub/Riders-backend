const mongoose=require("mongoose")
 const passengerSchema=mongoose.Schema({
    name:{type:String,required:true},
    phoneNumber:{type:String,required:true},// phonenumber doesn't change anytime so its string
    email:{type:String,required:true,unique:true},
    password:{type:String,min:6,max:12,required:true},
    gender:{type:String,required:true},
    profilePicture:{type:String,required:true},
    location:{type:String,required:true,lowercase:true},
    request:{type:Boolean,default:false},
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null }
},{versionKey:false})
  const passengerModel=mongoose.model("Rider",passengerSchema)
  module.exports={passengerModel}