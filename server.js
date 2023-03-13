require('dotenv').config();
const express = require('express');
const app = express();
const {v4:uuid} = require('uuid');
const bodyParser = require('body-parser');
const Room = require('./models/room');
const User = require('./models/user');
const axios = require('axios');
const  { google } = require('googleapis');
const session = require('express-session');

app.use(express.urlencoded({extended:true}));
app.use(session({secret:'secretCodeSync',resave:false,saveUninitialized:true,}));
const mongoose = require('mongoose');
mongoose.set('strictQuery',false);

const REDIRECT_URI = process.env.REDIRECT_URI;
const CLIENT_ID = process.env.CLIENT_ID;
const SECRET_ID = process.env.SECRET_ID;
const MONGODB_URI = process.env.MONGODB_URI;

const url =MONGODB_URI
mongoose.connect(url,{useNewUrlParser:true, useUnifiedTopology: true})
    .then(()=>{
        console.log('MONGO CONNECTION OPEN')
    })
    .catch(err=>{
        console.log('MONGO ERROR',err)
    })

app.use(express.static('public'))
app.use(express.urlencoded({extended:true}))
app.use(bodyParser.json());

app.set('view engine','ejs');

app.get('/',(req,res)=>{
    res.render('introPage')
})

const requireLogin = (req,res,next)=>{
    console.log(req.session.user_id)
    if(!req.session.user_id){
        return res.redirect('/')
    }
    next();
}


app.get('/TeleCode/newRoom',requireLogin,(req,res)=>{
    const roomID = {roomID:uuid()};
    res.render('newRoom',{roomID})
})

app.get('/TeleCode',async(req,res)=>{
    const code = req.query.code
    console.log({code});

    const user = getGoogleUser({code});

    user.then(async(result)=>{
        const id = result.id;
        const data = {
            name:result.name,
            email:result.email,
            id:result.id,
            image:result.picture
        }
        const count = await User.countDocuments({id:result.id})
        if(count ==0){
        User.insertMany(data)
            .then(res=>{
                console.log(res)
            }).catch(err=>{
                console.log(err)
            })
        }
        req.session.user_id = id;
        if (result.verified_email){
            res.render('startpage')
        }else{
            res.send('Not Verified')
        }
    })
    
})

app.post('/TeleCode/room/:roomID',(req,res)=>{
    const roomID= req.params.roomID;
    const data = {
        roomID:roomID,
        users:[req.body.username],
        language:req.body.language
    }
    Room.insertMany(data)
        .then(res=>{
            console.log(res)
        })
        .catch(e=>{
            console.log(e)
        })
    res.render('room',{data})
})

app.post('/getData',async(req,res)=>{
    console.log(req.body)
    const findRoomByID = req.body.roomID;
    console.log('roomID:',findRoomByID)
    const foundRoom = await Room.findOne({roomID:findRoomByID});
    console.log(foundRoom);
    res.send(foundRoom)
})

app.post('/joinRoom',async(req,res)=>{
    console.log(req.body)
    const roomID = req.body.roomId;
    const username = req.body.username;
    res.redirect(`/TeleCode/join/${roomID}`);
    await Room.updateOne({roomID:roomID},{$push:{users:username}})
})

app.get('/TeleCode/join/:roomID',requireLogin,async(req,res)=>{
    const roomID = req.params.roomID;
    const data = await Room.findOne({roomID:roomID});
    res.render('room',{data});
})

app.post('/peerJs',async(req,res)=>{
    const roomID = req.body.roomId;
    const peerID = req.body.clientId;
    const founduser = await Room.findOne({roomID:roomID});
    const clients = founduser.peerIds.length;
    console.log('CLIENTS_',clients)
    if(clients == 0){
        await Room.updateOne({roomID:roomID},{$push:{peerIds:peerID}});
    }
    if(clients == 1){
        console.log(founduser.peerIds[0])
        res.send(founduser.peerIds[0])
    }
    
})


app.get("/TeleCode/SignIn",(req,res)=>{
    res.redirect(getGoogleAuthURL())
});

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    SECRET_ID,
    REDIRECT_URI
  );

app.post ('/CodeSync/logout',(req,res)=>{
    req.session.destroy();
    res.redirect('/');
})


function getGoogleAuthURL(){
    const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    ];

    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: scopes, 
      });
  }

async function getGoogleUser({code}){
    const {tokens} = await oauth2Client.getToken(code);
    const googleUser = await axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${tokens.access_token}`,
    {
        headers:{
            Authorization:`Bearer ${tokens.id_token}`,
        },
    },
    ).then(res=>res.data)
    .catch(error =>{
        throw new Error(error.message);
    });
    return googleUser
}




app.listen(8080,()=>{
    console.log('SERVER RUNNING')
})