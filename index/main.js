var socket;
function _(selector){
  return document.querySelector(selector);
}
console.log('dekhlna');
var drawing = true;

function setup(){
  let canvas  = createCanvas(1000,600);
  canvas.parent("canvas-wrapper");
  background(255);
  let button = _('#reset');
  button.addEventListener("click",function(){
    clear();
    background(255);
    socket.emit('clear');
  })


  socket = io.connect('http://192.168.1.102:3000');

  socket.on('drawL',(data)=>{
    fill(data.color);
    strokeWeight(data.size);
    stroke(data.color)
    line(data.px,data.py,data.x,data.y);
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
  })

  socket.on('Udraw',()=>{
      drawing = true;
  })
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
