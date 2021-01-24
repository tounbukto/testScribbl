var express = require("express")
var app = express();
var socket  = require("socket.io")
var http = require("http").createServer(app);
const Game = require('./game')

let server  = http.listen(3000);

let io = socket(http,{
  cors:{
    origin: "http://192.168.1.104:3000",
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


app.get('/submit_form',(req,res)=>{
  user = {
    username: req.query.username,
    room:req.query.room
  };
  res.query = user;
  res.status(200).sendfile("index/game.html")
})






io.rooms = new Map();

io.sockets.on('connection',newConnection);

function newConnection(socket){
  

  socket.on('disconnect' , ()=>{
    let player = users[socket.id];
    games[player.user.room].disconnect(player);
  })


  socket.on('message',(data)=>{
    games[users[socket.id].user.room].message(data,socket);
  })

  socket.on('join',(user)=>{
    let newUser = {
      user: user,
      socket : socket,
      drawing : false,
      drew : false,
      score : 0
    }
    users[socket.id] = newUser;
    if(games[user.room] === undefined){
      games[user.room] = new Game(user.room,newUser,5,10);
      games[user.room].addPlayer(newUser);
    }
    else{
      games[user.room].addPlayer(newUser);
    }
  });

  socket.on('ready',()=>{
    games[users[socket.id].user.room].ready(users[socket.id].user);
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
