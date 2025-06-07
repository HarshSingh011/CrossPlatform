const express=require('express');
const connectdb = require('./src/db/db');
const mongoose=require('mongoose')
const app=express();
require('dotenv').config();

const port=process.env.PORT

app.listen(port,async()=>{
    console.log(` connected baby `)
    await connectdb(process.env.MONGO_URI);
    console.log("db connected ")
    console.log(`${process.env.MONGO_URI}`)
})