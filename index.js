var updateFPS = 30
var showMouse = true
var time = 0
var bgColor ="black"
 
var controls = { 
  value: 0 
}
var gui = new dat.GUI()
gui.add(controls,"value",-2,2).step(0.01).onChange(function(value){})

let PI = n => n === undefined? Math.PI : Math.PI*n
//------------------------
// Vec2

class Vec2{
  constructor(x,y){
    this.x = x
    this.y = y
  }
  set(x,y){
    this.x =x
    this.y =y
  }
  setV(v){
    this.x=v.x
    this.y=v.y
  }
  move(x,y){
    this.x+=x
    this.y+=y
  }
  add(v){
    return new Vec2(this.x+v.x,this.y+v.y)
  }
  sub(v){
    return new Vec2(this.x-v.x,this.y-v.y)
  }
  mul(s){
    return new Vec2(this.x*s,this.y*s)
  }
  get length(){
    return Math.sqrt(this.x*this.x+this.y*this.y)
  }
  set length(nv){
    let temp = this.unit.mul(nv)
    this.set(temp.x,temp.y)
  }
  clone(){
    return new Vec2(this.x,this.y)
  }
  toString(){
    return `(${this.x}, ${this.y})`
  }
  equal(v){
    return this.x==v.x && this.y ==v.y
  }
  get angle(){
    return Math.atan2(this.y,this.x)  
  }
  get unit(){
    return this.mul(1/this.length)
  }
  static get ZERO(){
    return new Vec2(0, 0)
  }
  static get UP(){
    return new Vec2(0,-1)
  }
  static get DOWN(){
    return new Vec2(0,1)
  }
  static get LEFT(){
    return new Vec2(-1,0)
  }
  static get RIGHT(){
    return new Vec2(1,0)
  }
  static DIR(str){
    if (!str) {
      return Vec2.ZERO
    }
    let type = (""+str).toUpperCase()
    return Vec2[type]
  }
  static DIR_ANGLE(str){
    switch(str){
      case "right":
        return 0
      case "left":
        return PI()
      case "up":
        return PI(-0.5)
      case "down":
        return PI(0.5)
    }
    return 0
  }
  
  
}

//------
var canvas = document.getElementById("mycanvas")
var ctx = canvas.getContext("2d")
circle= function(v,r){
  ctx.arc(v.x,v.y,r,0,PI(2))
}
line= function(v1,v2){
  ctx.moveTo(v1.x,v1.y)
  ctx.lineTo(v2.x,v2.y)
}

let getVec2 = (args)=>{
  if (args.length==1){
    return args[0]
  }else if (args.length==2){
     return new Vec2(args[0],args[1])
  }
}
let moveTo = function(){
  let v = getVec2(arguments)
  ctx.moveTo(v.x,v.y)
}
let lineTo = function(){
  let v = getVec2(arguments)
  ctx.lineTo(v.x,v.y)
}
let translate = function(){
  let v = getVec2(arguments)
  ctx.translate(v.x,v.y)
}
let arc = function(){
  ctx.arc.apply(ctx,arguments)
}
let rotate = (angle)=>{
  if(angle!=0){
    ctx.rotate(angle) 
  }
}
let beginPath = ()=>{ctx.beginPath()}
let closePath = ()=>{ctx.closePath()}
let setFill = (color)=>{ ctx.fillStyle=color }
let setStroke = (color)=>{ ctx.strokeStyle=color }
let fill = (color)=>{
  if(color){
    setFill(color)
  }
  ctx.fill()
}
let stroke = (color)=>{
  if(color){
    ctx.strokeStyle=color
  }
  ctx.stroke()
}

let save = (func)=>{
  ctx.save()
  func()
  ctx.restore()
}



function initCanvas(){
  ww = canvas.width = window.innerWidth
  wh = canvas.height = window.innerHeight
}
initCanvas()

var WSPAN = Math.min(ww,wh)/24
function GETPOS(i,o){
  let sourceV = getVec2(arguments)
  return sourceV
          .mul(WSPAN)
          .add(new Vec2(WSPAN/2,WSPAN/2))
}

class GameObject{
  constructor(args){    
    let def = {
      p: new Vec2(0,0),
      gridP: new Vec2(1,1),
    }
    Object.assign(def,args)
    Object.assign(this,def)
    this.p = GETPOS(this.gridP)
  }
  collide(gobj){
    return this.p.sub(gobj.p).length < WSPAN
  }
}

class Player extends GameObject{
  constructor(args){    
    super(args)
    let def = {
      nextDirection: null,
      currentDirection: null,
      isMoving: false,
      speed: 40
    }
    Object.assign(def,args)
    Object.assign(this,def)
  }
  draw(){
    beginPath()
    circle(this.p,5)
    fill("white")
  }
  get directionAngle(){ 
    return Vec2.DIR_ANGLE(this.currentDirection)
  } 
  moveStep(){

    let i0 = this.gridP.x,
        o0 = this.gridP.y
    let oldDirection = this.currentDirection
     
    let haveWall = map.getWalls(this.gridP.x,this.gridP.y)

    let avail = ['up','down','left','right']
                .filter(d=>!haveWall[d])

                if (!haveWall[this.nextDirection]){
      this.currentDirection=this.nextDirection   
    }

    this.gridP=this.gridP.add(Vec2.DIR(this.currentDirection))
    
    let isWall = map.isWall(this.gridP.x,this.gridP.y)
    if (!isWall){
      this.isMoving=true
      let moveStepTime = 10/this.speed
      

      if (this.gridP.x<=-1 && this.currentDirection=='left'){
        this.gridP.x=18
        moveStepTime=0 
      }
      if (this.gridP.x>=19 && this.currentDirection=='right'){
        this.gridP.x=0
        moveStepTime=0
      } 
      
      TweenMax.to(this.p,moveStepTime,{
        ...GETPOS(this.gridP),
        ease: Linear.easeNone,
        onComplete: ()=>{
          this.isMoving=false
          this.moveStep()
        }
      } )
      
      return true
    }else{

      this.gridP.set(i0,o0)   
      this.currentDirection = oldDirection
    }

  }
}
 
class Pacman extends Player{
  constructor(args){
    super(args)
    let def = {
      deg: Math.PI/4,
      r: 50,
      deadDeg: null,
      isDead: false
    }
    Object.assign(def,args)
    Object.assign(this,def)
  }
  update(){
    if (this.isDead){
      this.isMoving=false
    }
  }
  draw(){
    let useDeg = Math.PI/4
    if (this.isMoving){
      useDeg = this.deg
    }
    if (this.deadDeg){
      useDeg = this.deadDeg
    }
    save(()=>{
      translate(this.p)
      moveTo(Vec2.ZERO)
      rotate(this.directionAngle)
       
      rotate(useDeg)
      lineTo(this.r,0) 
      arc(0,0,this.r,0,2*Math.PI-useDeg*2)
      closePath()
      
      fill("yellow")
    })
   
  }
  die(){
    if (!this.isDead){

      TweenMax.killAll()
      this.isDead=true
      this.deadDeg=Math.PI

      TweenMax.from(this,1.5,{
        deadDeg: 0,
        ease: Linear.easeNone,
        delay: 1
      })
       
    }
  }
}

class Food extends GameObject{
  constructor(args){  
    super(args)  
    let def = {
      eaten: false,
      super: false 
    }
    Object.assign(def,args)
    Object.assign(this,def)
  }
  draw(){
    if (!this.eaten){
      save(()=>{
        translate(this.p)
        setFill("#f99595")
        if (this.super){

          if (time%20<10){
            beginPath()
            setFill("white")
            arc(0,0,WSPAN/5,0,PI(2))
            fill()  
          }
        }else{
          ctx.fillRect(-WSPAN/10,-WSPAN/10,WSPAN/5,WSPAN/5)
        } 

      })
    }
  }  
}

class Ghost extends Player{
  constructor(args){
    super(args)
    let def = {
      r: 50,
      color: "red",
      isEatable: false,
      isDead: false,
      eatableCounter: 0,
      traceGoCondition: [ 
        {
          name: 'left', condition:(target)=> (this.gridP.x>target.x),  
        }, 
        {
          name: 'right', condition:(target)=> (this.gridP.x<target.x),
        },
        {
          name: 'up', condition:(target)=> (this.gridP.y>target.y),
        },
        {
          name: 'down', condition:(target)=> (this.gridP.y<target.y)  
        },
      ]   
    }
    Object.assign(def,args)
    Object.assign(this,def)
  } 
  update(){
    this.speed=38
    if (this.isEatable)  this.speed=25
    if (this.isDead) this.speed=80
    if (this.isDead && this.gridP.equal(new Vec2(9,9)) ){
      this.reLive()
    }
  }
  draw(){
    save(()=>{
      translate(this.p)
    
      if (!this.isDead){
        beginPath()

        arc(0,0,this.r,PI(),0)
        lineTo(this.r,this.r)
        
        let tt = parseInt(time/3)
        let ttSpan = this.r*2/7
        let ttHeight = this.r/3

        for(var i=0;i<7;i++){
          ctx.lineTo(this.r*0.9-ttSpan*i,this.r+((i+tt)%2)*-ttHeight)
        }
        ctx.lineTo(-this.r,this.r)
        setFill( !this.isEatable?this.color:((time%10<5 || this.isEatableCounter>3)?"#1f37ef":"#fff"))
        fill()
      }
      
      let hasEye = !this.isEatable || this.isDead

      let eyeR = this.r/3
      let innerEyeR = eyeR/2
    
      if (hasEye){
        //eye shape
        beginPath()
        arc(-this.r/2.5,-eyeR,eyeR,0,PI(2))
        arc( this.r/2.5,-eyeR,eyeR,0,PI(2))
        fill("white")
        
      }
      

      save(()=>{
        beginPath()
        let innerEyePan = (Vec2.DIR(this.currentDirection)).mul(2)
        translate(innerEyePan) 
        arc(-this.r/2.5,-eyeR,innerEyeR,0,PI(2))
        arc(this.r/2.5,-eyeR,innerEyeR,0,PI(2))
        fill( hasEye ?"black":"white")
      }) 
    
    }) 
  }
  getNextDirection(map,pacman){
    let currentTarget = this.isDead?(new Vec2(9,9)):pacman.gridP 
    let go = !this.isEatable || this.isDead
        

    let traceGo = this.traceGoCondition.filter(obj=> {
      let cond = obj.condition(currentTarget) 
      return go? cond:!cond
    }).map(obj=>obj.name) 
    

    let haveWall = map.getWalls(this.gridP.x,this.gridP.y)
    

    let traceGoAndCanGo = traceGo
        .filter(o=>!haveWall[o] )
        .filter(nn=>
          Vec2.DIR(nn).add(Vec2.DIR(this.currentDirection) ).length!=0
        )
    
    let availGo =['left','right','up','down']
              .filter(d=>!haveWall[d])
    
    if (availGo.length==2){
      if ((haveWall.up && haveWall.down) || 
          (haveWall.left && haveWall.right) ){
        return this.currentDirection
      }
    }
    
    let finalPossibleSets = traceGoAndCanGo.length?traceGoAndCanGo:availGo
    let finalDecision = finalPossibleSets[ parseInt(Math.random()*finalPossibleSets.length) ] || 'top' 
    return finalDecision
  }
  die(){
    this.isDead=true
  }
  reLive(){
    this.isDead=false
    this.isEatable=false 
  }
  setEatable(time){
    this.isEatableCounter=time
    if (!this.isEatable){
      this.isEatable=true
      
      let func = (()=>{
        this.isEatableCounter--
        if (this.isEatableCounter<=0){
          this.isEatable=false
        }else{
          setTimeout(func,1000) 
        }
      })
      func()
      
    }
  }
}

class Map {
  constructor(){
    this.mapData =  [
      "ooooooooooooooooooo",
      "o        o        o",
      "o oo ooo o ooo oo o",
      "o+               +o",
      "o oo o ooooo o oo o",
      "o    o   o   o    o", 
      "oooo ooo o ooo oooo",
      "xxxo o       o oxxx",
      "oooo o oo oo o oooo", 
      "       oxxxo       ",
      "oooo o ooooo o oooo",
      "xxxo o   x   o oxxx",
      "oooo ooo o ooo oooo",
      "o    o   o   o    o",
      "o oo o ooooo o oo o",
      "o+               +o",
      "o oo ooo o ooo oo o",
      "o        o        o",
      "ooooooooooooooooooo",
    ]
    this.init()
  }
  init(){
    this.pacman = new Pacman({
      gridP: new Vec2(9,11),
      r: WSPAN/2
    })
TweenMax.to(this.pacman,0.15,{deg: 0,ease: Linear.easeNone,repeat: -1,yoyo: true})
    
    this.ghosts = Array.from({length: 4},(d,i)=>
      new Ghost({
        gridP: new Vec2(9+i%2,9), 
        r: WSPAN/2*0.9, 
        color: ["red","#ffa928","#16ebff","#ff87ab"][i%4]
      })
    )
    
    this.foods=[]
    for(let i=0;i<20;i++){
      for(let o=0;o<20;o++){
        let foodType=this.isFood(i,o)
        if (foodType){
          let food = new Food({
            gridP: new Vec2(i,o),
            super: foodType.super
          })
          this.foods.push(food)
        } 
      }
    }
    
  }
  
  draw(){
    for(let i=0;i<19;i++){
      for(let o=0;o<19;o++){
        save(()=>{
          translate(GETPOS(i,o)) 
          
          ctx.strokeStyle="rgba(255,255,255,0.5)"
          // ctx.strokeRect(-WSPAN/2,-WSPAN/2,WSPAN,WSPAN)  
          let walltype = this.getWalls(i,o)
          setStroke("blue")
          ctx.shadowColor = "rgba(30,30,255)"
          ctx.shadowBlur = 30
          ctx.lineWidth=WSPAN/5

          let typecode =  ['up','down','left','right']
              .map(d=>walltype[d]?1:0)
              .join("")
          typecode=walltype.none?"":typecode
          
          let countSide = (typecode.match(/1/g) || []).length
          
          let wallSpan = WSPAN / 4.5 
          let wallLen = WSPAN / 2

          if (typecode =="1100" || typecode=="0011"){
            if (typecode == "0011"){
              rotate(PI(0.5))
            }
            save(()=>{
              beginPath()
              moveTo(wallSpan,-wallLen)
              lineTo(wallSpan,wallLen)
              moveTo(-wallSpan,-wallLen)
              lineTo(-wallSpan,wallLen)
              stroke()
            })
          }else if ( countSide==2 ){
            let angles = {
              '1010': 0, '1001': 0.5,
              '0101': 1, '0110': 1.5
            }
            save(()=>{
              rotate( PI(angles[typecode]) )
              beginPath()
              arc(-wallLen,-wallLen,wallLen+wallSpan,0,PI(0.5))
              stroke()
              beginPath()
              arc(-wallLen,-wallLen,wallLen-wallSpan,0,PI(0.5))
              stroke()
              
            })
          }
          if ( countSide==1 ){
            let angles = {
              '1000': 0, '0001': 0.5,
              '0100': 1, '0010': 1.5
            }
            save(()=>{
               rotate( PI(angles[typecode]) )
              beginPath()
              arc(0,0,wallSpan,0,PI())
              stroke()

              beginPath()
              moveTo(wallSpan, -wallLen)
              lineTo(wallSpan, 0)
              moveTo(-wallSpan, -wallLen)
              lineTo(-wallSpan, 0)
              stroke()
            })
          }
          if (countSide==3){
            let angles = {
              '1011': 0, '1101': 0.5,
              '0111': 1, '1110': 1.5
            }
            save(()=>{
               rotate(     PI( angles[typecode] )    )
               
              beginPath()
              arc(-wallLen,-wallLen,wallLen-wallSpan,0,PI(0.5))
              stroke()
              
              beginPath()
              arc(wallLen,-wallLen,wallLen-wallSpan,-PI(1.5),-PI(1))
              stroke()
              
              beginPath()
              moveTo(-wallLen,wallSpan)
              lineTo(wallLen,wallSpan)
              stroke()
            })
            
          }
          
        })
      }
    }
  }
  getWallContent(o,i){
    //map array and reverse direction
    return this.mapData[i] && this.mapData[i][o]
  }
  isWall(i,o){
    let type = this.getWallContent(i,o)
    return type=="o"
  }
  getWalls(i,o){   
    return {
      up: this.isWall(i,o-1),
      down: this.isWall(i,o+1),
      left: this.isWall(i-1,o),
      right: this.isWall(i+1,o),
      none: !this.isWall(i,o)
    }
  }
  
  isFood(i,o){
    let type = this.getWallContent(i,o)
    if (type=="+" || type==" "){
      return {
        super: type=="+"
      } 
    }
    return false
    
  }
}

var map
function init(){
  map = new Map()
}

function update(){
  time++
    
  map.ghosts.forEach(ghost=>{
    ghost.update()
    
    ghost.nextDirection=ghost.getNextDirection(map,map.pacman)
    if (!ghost.isMoving){ 
      ghost.moveStep() 
    }
    
    if (!ghost.isDead && !map.pacman.isDead && ghost.collide(map.pacman)){
      if (!ghost.isEatable){
        
        map.pacman.die()
        setTimeout(()=>{
          map.init()
        },4000)
      }else {
        ghost.die()
        TweenMax.pauseAll()
        setTimeout(()=>{
          TweenMax.resumeAll()
        },500)
      }
    }

  }) 
  
  
  let currentFood = map.foods.find(food=>
        food.gridP.sub(map.pacman.gridP).length<=3 && 
        food.p.sub(map.pacman.p).length<=WSPAN/2 )
  
  
  if (currentFood && !currentFood.eaten){ 
    currentFood.eaten=true
   
    if (currentFood.super){
     
      map.ghosts.filter(ghost=>!ghost.isDead)
        .forEach(ghost=>{
          ghost.setEatable(10)
        })
    }
  }
}


function draw(){

  setFill(bgColor)
  ctx.fillRect(0,0,ww,wh)
 
  
  save(()=>{
    translate(ww/2-WSPAN*10,wh/2-WSPAN*10)
    map.draw()
    map.foods.forEach(food=>food.draw())
    map.pacman.draw()
    map.ghosts.forEach(ghost=>ghost.draw())
    setFill('white')
    ctx.font="20px Ariel"

    ctx.fillText("Score: "+ map.foods.filter(f=>f.eaten).length*10,0,-10)
  })

  
  setFill("red")
  beginPath()
  circle(mousePos,2)
  fill()
  
  save(()=>{
    beginPath()
    translate(mousePos)
    setStroke("red")
    let len = 20
    line(new Vec2(-len,0),new Vec2(len,0))
    line(new Vec2(0,-len),new Vec2(0,len))
    ctx.fillText(mousePos,10,-10)
    stroke()
  })
  
  //schedule next render
  requestAnimationFrame(draw)
}
function loaded(){
  initCanvas()
  init()
  requestAnimationFrame(draw)
  setInterval(update,1000/updateFPS)
}
window.addEventListener("load",loaded)
window.addEventListener("resize",initCanvas)

var mousePos = new Vec2(0,0)
var mousePosDown = new Vec2(0,0)
var mousePosUp = new Vec2(0,0)

window.addEventListener("mousemove",mousemove)
window.addEventListener("mouseup",mouseup)
window.addEventListener("mousedown",mousedown)
function mousemove(evt){
  mousePos.setV(evt)
  // console.log(mousePos)
}
function mouseup(evt){
  mousePos.setV(evt)
  mousePosUp = mousePos.clone()
}
function mousedown(evt){
  mousePos.setV(evt)
  mousePosDown = mousePos.clone()
}

window.addEventListener("keydown",function(evt){
  
  if (!map.pacman.isDead){
    map.pacman.nextDirection=evt.key.replace("Arrow","").toLowerCase()
    if (!map.pacman.isMoving){
      map.pacman.moveStep()
    }
  }
})