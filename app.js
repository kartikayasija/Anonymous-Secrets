require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const md5 = require("md5");
// const encrypt = require("mongoose-encryption");


const app = express();
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
mongoose.connect("mongodb://127.0.0.1:27017/secret");

const userSchema = new mongoose.Schema({
    email: String,
    password: String
})

// userSchema.plugin(encrypt,{secret: process.env.SECRET, encryptedFields:["password"]})

const User = mongoose.model("User",userSchema)
app.get("/",function(req,res){
    res.render("home.ejs");
})

app.get("/login",function(req,res){
    res.render("login.ejs");
})

app.get("/register",function(req,res){
    res.render("register.ejs");
})



app.post("/register",function(req,res){
    const newUser = new User({
        email : req.body.username,
        password: md5(req.body.password)
    })

    newUser.save(function(err){
        if(err) console.log(err);
        else res.render("secrets.ejs");
    });
})

app.post("/login",function(req,res){
    const username = req.body.username;
    const password = md5(req.body.password);
    User.findOne({email: username},function(err,x){
        if(err) console.log(err);
        else{
            if(x){
                if(x.password===password){
                    res.render("secrets.ejs");
                }
            }
        }
    })
})
app.listen(3000,function(){
    console.log("Started");
})