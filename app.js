require('dotenv').config();
const express = require("express");
const bodyParser =require("body-parser");
const ejs =require("ejs");
const mongoose =require("mongoose")
const encrypt = require("mongoose-encryption");

const app = express()
 console.log(process.env.API_KEY);
app.use(bodyParser.urlencoded({
    extended:true
}));

app.use(express.static("public"));

app.set('view engine' , 'ejs')

mongoose.connect("mongodb://localhost:27017/userDB",{
    useUnifiedTopology:true,
    useNewUrlParser:true
})

const userSchema = new mongoose.Schema( {
    email:String,
    password:String
});


userSchema.plugin(encrypt, {secret:process.env.SECRET,encryptedFields:["password"]});

const User = new mongoose.model("User", userSchema);

app.get("/",(req,res) =>{
    res.render("home");
})

app.get("/login",(req,res) =>{
    res.render("login");
})

app.get("/register",(req,res) =>{
    res.render("register");
});

app.post("/register" , (req,res) => {
   const newUser = new User({
    email: req.body.username,
    password:req.body.password
   });
   newUser.save(function(err){
    if(!err){
        res.render("secrets");
    }else{
        console.log(err);
    }
   })
})

app.post("/login" , (req,res) => {
    const username = req.body.username;
    const password = req.body.password;
    User.findOne({email: username},function(err , founduser){
      if(err){
        console.log(err);
      }else {
        if(founduser){
         if(founduser.password === password){
            res.render("secrets");
         }
      }}
    })
})







app.listen(3000,(req,res) => {
    console.log("server started on port 3000")
})