require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const port = 8000;
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
const session = require('express-session');
const passport = require('passport');
const passportlocalMongoose = require('passport-local-mongoose'); 
// const encrypt = require('mongoose-encryption');
// const md5 = require('md5');
// const bcrypt = require('bcrypt');
// const saltRounds = 10
// //Dependecies
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine','ejs');
app.use(express.static("public"));

// app.use(session({
//     secret: 'my little secret',
//     resave: false,
//     saveUninitialized: false,

//   }))

app.use(session({
    name: 'codeial',
    // TODO change the secret before deployment in production mode
    secret: process.env.secret,
    saveUninitialized: false,
    resave: false,
    cookie: {
        maxAge: (1000 * 60 * 100)
    },
    store :  MongoStore.create ({
        
                 mongoUrl:'mongodb://localhost/userDB',
           autoRemove:'disabled'
        
        },
        function(err){
            console.log(err ||  'connect-mongodb setup ok');
        }
    )
}));




app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
    email: {
        type: String,
      
    },
    
    password: {
        type: String,
        

    } ,
    secret:{
        type: String,
    } 
},{
    timestamps: true
});

userSchema.plugin(passportlocalMongoose);

//mongoose encryption Method
// userSchema.plugin(encrypt,{secret:process.env.SECRET
//      , encryptedFields: ['password']});

const User = mongoose.model('User', userSchema);


passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser()); 

////////////////////////////////Routes

app.get('/',function(req,res){
    res.render('home');
})
app.get('/login',function(req,res){
    res.render('login');
})
app.get('/register',function(req,res){
    res.render('register');
})
app.get('/secrets',function(req,res){
    User.find({"secret": {$ne:null}},function(err,foundusers){
        if(err){
            console.log(err);
        }else{
            if(foundusers){
                res.render("secrets",{userWithSecrets :foundusers});
            }
        }
    });
    
})

app.get('/submit',function(req,res){
    if(req.isAuthenticated()){
        res.render('submit');
    }else{
        res.redirect('/login');
    }
    
})




//logout function 
app.get('/logout',function(req,res){
    req.logout(function(err) {
        if (err)
        { 
            console.log(err);
         }
        res.redirect('/');
      });
})


///Handling Post Requests From the Forms 


app.post('/submit',function(req,res){
    const submittedSecret = req.body.secret;
    User.findById(req.user.id,function(err,founduser){
        if(err){
            console.log(err);
        }
        else{
            if(founduser){
                founduser.secret = submittedSecret;
                founduser.save(function(){
                    res.redirect('/secrets');
                });
            };
        };
    });
});



app.post('/register',function(req,res){

    // bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    //     // Store hash in your password DB.
    //     if(err){
    //         console.log(err);
    //     }

    //     const newUser = new User ({
    //         email:req.body.username,
    //         password: hash
    //       })
        
    //     newUser.save(function(err){
    //         if(err){
    //             console.log(err);
    //         }
    //         else{
    //             res.render("secrets");
    //         }
    //     });


    // });


    //passsport local mongoose is used here to authenticate and send cookies to the browser to create session
        User.register({username:req.body.username},req.body.password,function(err,user){
            if(err){
                console.log(err);
                res.redirect('/register');
            }else{
                passport.authenticate("local")(req,res,function(){
                    res.redirect('/secrets');
                })
            }
        })
    


})


app.post('/login',function(req,res){




   
 
    // User.findOne({email:req.body.username},function(err,founduser){

    //     if(err){
    //         console.log(err);

    //     }
    //     else{
    //         if(founduser){
    //             bcrypt.compare(req.body.password,founduser.password, function(err, result) {
    //                 if(result === true){
    //                     res.render("secrets");
    //                 }
    //             });
                   
            
    //         }
    //     }

    // })
  


//passport local mongoose


const user = new User({
    username:req.body.username,
    password:req.body.password
});

req.logIn(user,function(err){
    if(err){
        console.log(err);
    }
    else{
        passport.authenticate("local")(req,res,function(){
            res.redirect('/secrets');
        })
    }
})  



  })



///Server Is Running
app.listen(port,function(err){
    if(err){
        console.log("Error Connecting to the Server");
    }
    console.log(`Server is running on the port ${port}`);
   


})