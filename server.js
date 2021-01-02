var express = require("express")
var app = express();
var socket  = require("socket.io")
var http = require("http").createServer(app);


let server  = http.listen(3000);

var users = [];


// app.use(express.static('index'))

app.get('/',(req,res)=>{
  res.set('Content-Type', 'text/html')
  res.status(200).sendfile("index/index.html");
})

app.get('/main.js',(req,res)=>{
  res.status(200).sendfile("index/main.js");
})

app.get('/style.css',(req,res)=>{
  res.status(200).sendfile("index/style.css");
})

app.get('/submit_form',(req,res)=>{
  console.log('submited');
  console.log(req.query);
  res.status(200).sendfile("index/game.html")
})

var io = socket(http,{
  cors:{
    origin: "http://192.168.1.102:3000",
    methods:["GET","POST"]
  }
});


io.sockets.on('connection',newConnection);

function newConnection(socket){

  console.log(socket.id);
  // socket.on('join',(user)=>{
  //   if(emptyRoom(user.room)){
  //       user.drawing = true;
  //       socket.emit('Udraw');
  //   }else{
  //     user.drawing = false;
  //   }
  //   users.add(user);
  //   socket.join(user.room);
  // });

  socket.on('drawL',(data)=>{
    socket.broadcast.emit('drawL',data);
  });

  socket.on('drawE',(data)=>{
    socket.broadcast.emit('drawE',data);
  });

  socket.on('clear',()=>{
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
