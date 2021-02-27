function _(selector){
  return document.querySelector(selector);
}

var socket = io();

var drawing = false;
var word_found = false;

function setup(){
  let canvas  = createCanvas(1000,600);
  canvas.parent("canvas-wrapper");
  background(255);
  let send =  _('#send');
  send.addEventListener("click",(e)=>{
    e.preventDefault();
    let message = _('#message');
    if(message.value !== '' && !word_found){
      socket.emit('message',message.value);
    }
    message.value = '';
  });
  let textArea = _('#message');
  textArea.addEventListener('keyup',(event)=>{
    event.preventDefault;
    if(event.keyCode === 13){
      send.click();
    }
  });
  let button = _('#reset');
  button.addEventListener("click",function(){
    if(drawing === true ){
      clear();
      background(255);
      socket.emit('clear');
    }
  })

  user = {
    username : Qs.parse(location.search,{
      ignoreQueryPrefix : true
    }).username,
    room : Qs.parse(location.search,{
      ignoreQueryPrefix : true
    }).RoomId
  }
  console.log(user);

  {
    let playersNames = _('#players');
    let newPlayer = document.createElement('p');
    newPlayer.textContent = user.username;
    playersNames.appendChild(newPlayer);
  }
  
  if(user.room === undefined){
    socket.emit('join',user);
  }else if(user.room === '?'){
    socket.emit('createRoom',user);
  }
  else{
    socket.emit('joinRoom',user);
  }
socket.on('drawL',(data)=>{
    fill(data.color);
    strokeWeight(data.size);
    stroke(data.color)
    line(data.px,data.py,data.x,data.y);
  });

  socket.on('user join',(user)=>{
    let playersNames = _('#players');
    let newPlayer = document.createElement('p');
    newPlayer.textContent = user.username;
    newPlayer.id = user.id;
    playersNames.appendChild(newPlayer);
  })

  socket.on('user deco',(user)=>{
    let playersNames = _('#players');
    let userDeco = _(`#${user}`);
    playersNames.removeChild(userDeco);
  })

  socket.on('players', (players)=>{
    let playersNames = _('#players');
    
    for(let i=0 ; i<players.length ; ++i){
      let newPlayer = document.createElement('p');
      newPlayer.textContent = players[i].username;
      newPlayer.id = `${players[i].id}`;
      playersNames.appendChild(newPlayer);
    }
  })

  socket.on('message',(message)=>{
    let newMsg = document.createElement('p');
    newMsg.textContent = message;
    _('#messages').appendChild(newMsg);
    _('#messages').scrollTop = _('#messages').scrollHeight;
  })

  socket.on('drawE',(data)=>{
    fill(data.color);
    strokeWeight(data.size);
    stroke(data.color)
    ellipse(data.x,data.y,data.size,data.size);
  })

  socket.on('clear',()=>{
    clear();
    background(255);
    word_found = false;
  })

  socket.on('game finished' , (data)=>{

    let button = _('#ready');
    button.style.display = 'block';
    button.disabled = false;
    button.backgroundColor = '';
    _('#words').style.display = 'none';
  })

  socket.on('stop drawing', ()=>{
    drawing = false;
    _('#words').style.display = 'none';
  })

  socket.on('timer' , (time) => {
    let timer = setInterval(() => {
      time--;
      if(time <= 0 ){
        clearInterval(timer);
      }
    }, 1000)
  })


  socket.on('ready' , (user)=>{
    console.log('users ready' + user);
  });

  socket.on('game started',()=>{
    _('#ready').style.display = "none";
  });
  

  socket.on('Udraw',(data)=>{
      drawing = true;
      _('#word1').innerHTML = data[0];
      _('#word2').innerHTML = data[1];
      _('#word3').innerHTML = data[2];
      _('#words').style.display = 'block';
      word_found = true;
  })

  socket.on('good Word',(data)=>{
    let newMsg = document.createElement('p');
    newMsg.textContent = 'GOOD WORD : '+data;
    _('#messages').appendChild(newMsg);
    _('#messages').scrollTop = _('#messages').scrollHeight;
    word_found = true;
  })
}

function ready(){
    socket.emit('ready');
    let x = _('#ready');
    x.style.backgroundColor = "green";
    x.disabled = true;
}



function wordToDraw(id){
  let word = _(`#${id}`).innerHTML;
  socket.emit('word picked' , word);
  _('#words').style.display = 'none';
}

function mouseDragged(){
  if(drawing === true){
    let size  = _('#big').checked ? _('#big').value : (_('#medium').checked ? _('#medium').value : _('#small').value);
    let color = _('#color-draw').value;
    fill(color);
    stroke(color);
    let penType = _('#pen-pencil').checked ? "pencil" : "brush";
    if (penType === "pencil") {
      strokeWeight(size);
      line(pmouseX,pmouseY,mouseX,mouseY)
      let data = {
        px:pmouseX,
        py:pmouseY,
        x:mouseX,
        y:mouseY,
        color:color,
        size:size
      };
      socket.emit('drawL',data);
    }else {
      ellipse(mouseX,mouseY,size,size);
      let data = {
        x:mouseX,
        y:mouseY,
        color:color,
        size:size
      };
      socket.emit('drawE',data);
    }
  }
}
