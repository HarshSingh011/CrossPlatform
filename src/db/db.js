const mongoose=require('mongoose');
require('dotenv').config();
const connectdb=async(MONGO_URI)=>{
await mongoose.connect(MONGO_URI)
}

module.exports=connectdb;