const words = require('./word');
let word = require('./word')
module.exports =  class Game{
    roomId;
    users = [];
    admin;
    roundNbr;
    roundTime;
    delay;
    start = false;
    readyPlayers = 0;
    drawPicked = '';
    constructor(roomId,admin,rn,rt){
        this.roomId = roomId;
        this.admin = admin;
        this.roundNbr = rn;
        this.roundTime = this.delay = rt;
    }

    disconnect(user){
        for(let i=0 ; i<this.users.length ; ++i){
            if(this.users[i].socket.id !== user.socket.id){
                this.users[i].socket.emit('user deco',user.user);
            }
        }
        this.deleteUser(user);
        if(this.users.length <= 0 ){
            this.roundNbr = -1;
            this.roundTime = -1;
        }
    }

    addPlayer(user){
        if(this.start === true){   
            user.socket.emit('game started');
        }
        let players=  [];
        for(let i=0 ; i<this.users.length ; ++i){
            players.push(this.users[i].user);
            this.users[i].socket.emit('user join',user.user);
        }
        user.socket.emit('players' ,players );
        this.users.push(user);
    }

    deleteUser(user){
        for(let i=0 ; i<this.users.length ; ++i){
            if(this.users[i].socket.id === user.socket.id){
                this.users.splice(i,1);
                break;
            }
        }
    }

    randomWords(){
        let a,b,c;
        a = Math.random()*words.length;
        a = Math.floor(a);
        b = Math.floor(Math.random()*words.length);
        c = Math.floor(Math.random()*words.length);
        while(b===a){
            b = Math.floor(Math.random()*words.length);
        }
        while(b===c || c===a){
            c = Math.floor(Math.random()*words.length);
        }
        return [words[a],words[b],words[c]];
    }


    play(){
        for(let i=0 ; i<this.users.length ; ++i){
            this.users[i].socket.emit('game started');
        }
        this.start = true;
        this.nextRound();
    }

    wordToDraw(word){
        this.drawPicked = word;
    }

    countDown(){
        let timer  = setInterval(()=>{ 
            console.log(this.roundTime);
            if(this.roundTime-- <= 0 ){
                this.clear();
                for(let i=0 ; i<this.users.length ; ++i){
                        this.users[i].socket.emit('round finished');
                }
              if(--this.roundNbr >0){
                  this.nextRound();
                  this.start = false;
                  for(let i=0 ; i<this.users.length ; i++){
                      this.users[i].socket.emit('game finished',this.winner());
                  }
              }
              this.roundTime = this.delay;
              clearInterval(timer);
            }
          }, 1000);
    }

    nextRound(){
        let randWords = this.randomWords();
        for(let i=0 ; i<this.users.length ; ++i){
            if(this.users[i].drawing === true){
                this.users[i].drew = true;
                this.users[i].drawing = false;
                this.users[i].socket.emit('stop drawing');
            }
        }
        for(let i=0 ; i <this.users.length ; ++i ){
            if(this.users[i].drew !== true){
                this.users[i].drawing = true;
                this.users[i].socket.emit('Udraw',randWords);
                break;
            }
            if(i===this.users.length-1){
                this.users[0].socket.emit('Udraw',randWords);
                this.users[0].drawing = true;
                for(let j=0 ; j<this.users.length ; ++j){
                    this.users[j].drew = false;
                }
            }
        }
        this.countDown();
    }

    draw(data ,SID){
        for(let i=0 ; i<this.users.length ; ++i){
            this.users[i].socket.emit('drawL',data);
        }
    }



    ready(user){
        for(let i=0 ; i<this.users.length ; ++i){
            this.users[i].socket.emit('ready',user);
        }
        this.readyPlayers++;
        if(this.readyPlayers >= this.users.length && this.start === false){
            this.start = true;
            this.play();
        }
    }

    clear(){
        for(let i=0 ; i<this.users.length ; ++i){
            this.users[i].socket.emit('clear');
        }
    }

    message(data){
        for(let i=0 ; i<this.users.length ; ++i){
            this.users[i].socket.emit('message',data);
        }
    }

    winner(){
        let max = 0;
        for(let i=0 ; i<this.users.length ; ++i){
            if(this.users.score>max){
                max = this.users.score;
            }
        }
        return max;
    }
}