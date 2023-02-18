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
    password: String
})

// userSchema.plugin(encrypt,{secret: process.env.SECRET, encryptedFields:["password"]})
userSchema.plugin(passportLocalMongoose);           //Passport

const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());                 //Passport
passport.serializeUser(User.serializeUser());        //Passport
passport.deserializeUser(User.deserializeUser());    //Passport



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
        res.render("secrets.ejs");
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
app.listen(3000,function(){
    console.log("Started");
})