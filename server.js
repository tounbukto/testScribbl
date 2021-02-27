var express = require("express")
const UUID = require('uuid');
const roomId = UUID.v4;
var app = express();
var socket  = require("socket.io")
var http = require("http").createServer(app);
const Game = require('./game')

let server  = http.listen(3000);

let io = socket(http,{
  cors:{
    origin: "http://41.141.71.145:3000",
    methods:["GET","POST"]
  }
});

let users = new Map();
let games = new Map();


app.get('/',(req,res)=>{
  res.set('Content-Type', 'text/html')
  res.status(200).sendfile("index/index.html");
})

app.get('/main.js',(req,res)=>{
  res.status(200).sendfile("index/main.js");
})


app.get('/index.js',(req,res)=>{
  res.status(200).sendfile("index/index.js");
})


app.get('/style.css',(req,res)=>{
  res.status(200).sendfile("index/style.css");
})

app.get('/join_game',(req,res)=>{
    // var room = req.query.room;
    res.status(200).sendfile("index/game.html");
})

app.get('/submit_form',(req,res)=>{
  user = {
    username: req.query.username,
    room:req.query.room
  };
  res.query = user;
  res.status(200).sendfile("index/game.html")
})

app.get('/create',(req,res)=>{
  user = {
    username: req.query.username,
    room:roomId()
  };
  res.query = user;
  res.status(200).sendfile("index/game.html");
})




io.rooms = new Map();

io.sockets.on('connection',newConnection);

function newConnection(socket){
  

  socket.on('disconnect' , ()=>{
    let player = users.get(socket.id);
    games.get(player.user.room).disconnect(player);
  })


  socket.on('message',(data)=>{
    games.get(users.get(socket.id).user.room).message(data,socket);
  })

  socket.on('join',(user)=>{
     let game = searchGame();
     let newUser = {
       user: user,
       socket : socket,
       drawing : false,
       drew : false,
       score : 0
     }
     users.set(socket.id,newUser);
     if(game === null){
       gameId = roomId();
       user.room = gameId;
       game = new Game(gameId,newUser,5,100);
       games.set(gameId,game);
      }
      user.room = game.roomId;
       game.addPlayer(newUser);
  });

  socket.on('joinRoom',(user)=>{
    console.log(user);
    let newUser = {
      user: user,
      socket : socket,
      drawing : false,
      drew : false,
      score : 0
    }
    users.set(socket.id, newUser);
      games.get(user.room).addPlayer(newUser);
  });

  socket.on('createRoom',(user)=>{
    user.room = roomId();
    console.log('creation de partie '+user.room);
    let newUser = {
      user: user,
      socket : socket,
      drawing : false,
      drew : false,
      score : 0
    }
    users.set(socket.id,newUser);
      // users[socket.id] = newUser;
        games.set(user.room,new Game(user.room,newUser,5,100));
        games.get(user.room).addPlayer(newUser);
        socket.emit('roomId',user.room);
  });

  socket.on('ready',()=>{
    games.get(users.get(socket.id).user.room).ready(users.get(socket.id).user);
  })




  socket.on('drawL',(data)=>{
    games[users[socket.id].user.room].draw(data,socket.id);
  });

  socket.on('word picked' , (word)=>{
    games[users[socket.id].user.room].wordToDraw(word);
  });

  socket.on('clear',()=>{
    games[users[socket.id].user.room].clear();
    socket.broadcast.emit('clear');
  })
}

function emptyRoom(room){
  for(var user in users){
    if(user.room === room){
      return false;
    }
  }
  return true;
}

function searchGame(){
  for(const [key ,value] of games){
    if(value.users.length < 4){
      return value;
    }
  }
  return null;
}