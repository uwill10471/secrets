require('dotenv').config();
const express = require("express");
const bodyParser =require("body-parser");
const ejs =require("ejs");
const mongoose =require("mongoose")
const session = require("express-session");
const passport =require("passport");
const passportLocalMongoose = require("passport-local-mongoose")
const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
const findOrCreate = require("mongoose-findorcreate")


const app = express()
 console.log(process.env.API_KEY);
app.use(bodyParser.urlencoded({
    extended:true
}));

app.use(express.static("public"));

app.set('view engine' , 'ejs')

app.use(session({
    secret:"our little secrets.",
    resave:false,
    saveUninitialized:true,
    
}))

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1/userDB",{
    useUnifiedTopology:true,
    useNewUrlParser:true
})
 

const userSchema = new mongoose.Schema( {
    email:String,
    password:String,
    googleId:String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate)




const User = new mongoose.model("User", userSchema);
const LocalStrategy =require('passport-local')
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(function(User,done){
    done(null,User)
});
passport.deserializeUser(function(User,done){
    done(null,User)
});
//google oauth2
passport.use(new GoogleStrategy({
    clientID:     process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    passReqToCallback   : true
  },
  function(request, accessToken, refreshToken, profile, done) {
    
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));


app.get("/",(req,res) =>{
    res.render("home");
})
// below code from passport google oauth2 for authentication
app.get("/auth/google", passport.authenticate("google",{scope : ["profile"]}))

app.get( '/auth/google/secrets',
    passport.authenticate( 'google', {
        
        failureRedirect: '/login'
}),

function(req,res){
    res.redirect("/secrets");
});
        



app.get("/login",(req,res) =>{
    res.render("login");
})

app.get("/register",(req,res) =>{
    res.render("register");
});
app.get("/secrets", function(req,res){
    User.find({"secret":{$ne:null}},function(err, foundUsers){
        if(foundUsers){
            res.render("secrets",{usersWithSecrets:foundUsers});
        }
    })
})

app.get("/logout", (req,res) => {
    req.logOut(function(err){
        if(err){
            console.log(err);
        }
            res.redirect("/");
    });

})

app.get("/submit", function(req,res){
      if(req.isAuthenticated()){
        res.render("submit");
    }else{
        res.redirect("/login");
    }
})

app.post("/register" , (req,res) => {
User.register({username:req.body.username},req.body.password, function(err,user){ //register here comes from passportt-local-mongoose
    if(err) {
        console.log(err);
        res.redirect("/register")
    }else{
        passport.authenticate("local")(req,res,function(){
           res.redirect("/secrets");
        })
    }
})
   
});

app.post("/login" , (req,res) => {
    const user = new User({
        username:req.body.username,
        password:req.body.password
    })
  
   req.login(user, function(err){
    if(err){
        console.log(err);
    }else{
        passport.authenticate("local")(req,res,function(){
            res.redirect("/secrets");
        })
    }
   }) 



})

app.post("/submit" , (req,res) => {
    

    console.log(req.user._id);

    User.findById(req.user._id ,function(err,foundUser){
        if(err){
            console.log(err);
        }else{
            if(foundUser){
                foundUser.secret = req.body.secret;
                foundUser.save(function(){
                    res.redirect("/secrets")
                })
            }
        }
    })
})
 






app.listen(3000,(req,res) => {
    console.log("server started on port 3000")
})