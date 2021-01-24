const words = require('./word');
let word = require('./word')
module.exports =  class Game{
    timer;
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
                this.users[i].socket.emit('user deco',user.socket.id);
            }
        }
        if(user.drawing === true ){
            this.nextRound();
            this.countDown();
            this.roundTime = this.delay;
        }
        this.deleteUser(user);
        if(this.users.length <= 0 ){
            clearInterval(this.timer);
        }
    }

    addPlayer(user){
        if(this.start === true){   
            user.socket.emit('game started');
        }
        let players=  [];
        for(let i=0 ; i<this.users.length ; ++i){
            let player = {
                username : this.users[i].user.username,
                id   : this.users[i].socket.id,
                score : this.users[i].score
            }
            players.push(player);
            this.users[i].socket.emit('user join',{username : user.user.username , id : user.socket.id});
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
        if(this.readyPlayers > 0 && this.readyPlayers>=this.users.length){
            this.play();
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
        this.start = true;
        for(let i=0 ; i<this.users.length ; ++i){
            this.users[i].socket.emit('game started');
        }
        this.nextRound();
        this.countDown();
    }

    wordToDraw(word){
        this.drawPicked = word;
    }

    countDown(){
        clearInterval(this.timer);
        this.timer = setInterval(()=>{ 
            console.log(this.roundTime);
            if(this.roundTime-- <= 0 ){
                this.clear();
                for(let i=0 ; i<this.users.length ; ++i){
                        this.users[i].socket.emit('round finished');
                }
                if(--this.roundNbr >0){
                    this.roundTime = this.delay;
                    this.nextRound();
                }
                else{
                    this.gameFinished();
                    clearInterval(this.timer);
                }
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

    message(data,socket){
        if(data !== this.drawPicked){
            for(let i=0 ; i<this.users.length ; ++i){
                this.users[i].socket.emit('message',data);
            }
        }
        else{
            for(let i=0 ; i<this.users.length ; ++i){
                if(this.users[i].socket.id === socket.id){
                    console.log(this.users[i]);
                    this.users[i].score +=100;
                }
            }
            socket.emit('good Word', data);
        }
    }

    winner(){
        let max = -1;
        let userWinner
        for(let i=0 ; i<this.users.length ; ++i){
            if(this.users[i].score>max){
                userWinner = this.users[i].user;
                max = this.users[i].score;
            }
        }
        return {
            winner : userWinner,
            score  : max 
        };
    }
    
    gameFinished(){
        let winner = this.winner();
        for(let i=0 ; i<this.users.length ; ++i){
            this.users[i].socket.emit('game finished' , winner);
            this.users[i].score = 0;
        }
        this.resetGame();
    }


    resetGame(){
        this.readyPlayers = 0;
        this.start = false;
        this.roundNbr = 5;
        this.roundTime = this.delay;
        for(let i=0 ; i<this.users.length ; ++i){
            this.users[i].score = 0;
        }
    }
}