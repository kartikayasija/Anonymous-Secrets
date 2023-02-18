require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
// const md5 = require("md5");
// const encrypt = require("mongoose-encryption");
const session = require("express-session");                       //Passport
const passport = require("passport");                             //Passport
const passportLocalMongoose = require("passport-local-mongoose");  //Passport
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");


const app = express();
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({                                             //Passport
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize());                                //Passport
app.use(passport.session());                                   //Passport
mongoose.connect("mongodb://127.0.0.1:27017/secret");

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: [String],
})

// userSchema.plugin(encrypt,{secret: process.env.SECRET, encryptedFields:["password"]})
userSchema.plugin(passportLocalMongoose);           //Passport
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());                 //Passport
// passport.serializeUser(User.serializeUser());        //Passport
// passport.deserializeUser(User.deserializeUser());    //Passport

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username, name: user.name });
    });
});
  
passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile);
    User.findOrCreate({username: profile.id,googleId: profile.id}, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/",function(req,res){
    res.render("home.ejs");
})

app.get("/login",function(req,res){
    res.render("login.ejs");
})

app.get("/register",function(req,res){
    res.render("register.ejs");
})

app.get("/secrets",function(req,res){
    if(req.isAuthenticated()){
        User.find({"secret":{$ne: null}},function(err,x){
            if(err) console.log(err);
            else{
                if(x){
                    res.render("secrets",{usersWithSecret: x});
                }
            }
        })
    }
    else{
        res.redirect("/login");
    }
})

app.get("/logout",function(req,res){
    req.logout(function(err){
        if(!err) res.redirect("/");
    });
    
})

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);

app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
});

app.get("/submit",function(req,res){
    if(req.isAuthenticated()) res.render("submit.ejs");
    else res.redirect("/login");
})

app.post("/register",function(req,res){

    User.register({username: req.body.username}, req.body.password,function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            })
        }
    })
})

app.post("/login",function(req,res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
    })

    req.login(user,function(err){
        if(err) console.log(err);
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            })
        }
    })
})

app.post("/submit",function(req,res){
    const submit = req.body.secret;

    User.findById(req.user.id,function(err,x){
        if(err) console.log(err);
        else{
            if(x){
                x.secret.push(submit);
                x.save();
                res.redirect("/secrets");
            }
        }
    })

})

app.listen(3000,function(){
    console.log("Started");
})