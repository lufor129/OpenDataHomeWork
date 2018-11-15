var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser')

const geolib = require('geolib');
const csv = require('csvtojson');
const fs = require('fs');


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var jsonParser = bodyParser.json()

var app = express();
let all = fs.readFileSync("./All_Station.txt",'utf8');
let stations= [];
let csvData = []
let spots = {};

all.split(/\n/).forEach(line=>{
  let temp = line.split("_");
  stations.push({
    [temp[1]]:temp[0]
  });
});

csv({headers:['Name','lat','lng','county'],delimiter:','}).fromFile(`./WStat.csv`).then((jsonObj)=>{
  let temp = jsonObj;
  csvData = jsonObj;
  let arr=[]
  temp.forEach(item=>{
    let t = item.Name.split("_");
    arr.push({
      Name:t[1],
      id:t[0],
      county:item.county,
      position:{
        lng:parseFloat(item.lng),
        lat:parseFloat(item.lat)
      }
    })
    spots[t[1]] = {"latitude":parseFloat(item.lat),"longitude":parseFloat(item.lng)};
  })
  stationsLocate = arr;
})


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.all('*', (req, res, next) => {
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization, Accept,X-Requested-With,x-csrf-token');
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Credentials', true);
  // 這裡不能用 * 號, 要改成 domain 的方式才能設置 cookies
  if (req.method === 'OPTIONS') {
    res.send(200);
  } else {
    next();
  }
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.get("/dataStation",function(req,res,next){
  let station = req.query.station;
  let temp = ""
  stations.forEach(dict=>{
    if(dict[station]!=undefined){
      temp = dict[station];
    }
  })
  if(temp == ""){
    res.send(["沒有","這個","測站"]);
  }else{
    var result = require(`./AllData/${temp}.json`);
    console.log(result);
    let data={};
    for(let i in result){
      let temp = i.split("-");
      let YM  = temp[0]+"-"+temp[1];
      if(data[YM]!=undefined){
        data[YM] += result[i];
      }else{
        data[YM] = result[i];
      }
    }
    //排序並4捨五入
    let SortedData = {};
    for(let j=2010;j<2019;j++){
      for(let i=1;i<13;i++){
        if(j==2018 && i>=10) break;
        let date = j+"-"+i;
        if(data[date]==undefined) continue;
        SortedData[date]=Math.round(data[date]);
      }
    }
    res.send(SortedData);
  }
})
app.post("/findThreeStation",function(req,res,next){
  // var spots = {
  //   "Brandenburg Gate, Berlin": {latitude: 52.516272, longitude: 13.377722},
  //   "Dortmund U-Tower": {latitude: 51.515, longitude: 7.453619},
  //   "London Eye": {latitude: 51.503333, longitude: -0.119722},
  //   "Kremlin, Moscow": {latitude: 55.751667, longitude: 37.617778},
  //   "Eiffel Tower, Paris": {latitude: 48.8583, longitude: 2.2945},
  //   "Riksdag building, Stockholm": {latitude: 59.3275, longitude: 18.0675},
  //   "Royal Palace, Oslo": {latitude: 59.916911, longitude: 10.727567}
  // }
  // let temp = geolib.findNearest({latitude: 59.916911, longitude: 10.7277}, spots, 0)
  // res.send(temp);
  let result = [];
  for(let i=0;i<3;i++){
    let temp = geolib.findNearest(req.body.data, spots, i);
    csvData.forEach(item=>{
      let t = item.Name.split("_");
      if(temp.key == t[1]){
        result.push({
          Name:t[1],
          id:t[0],
          county:item.county,
          position:{
            lng:parseFloat(item.lng),
            lat:parseFloat(item.lat)
          },
          distance:temp.distance
        })
      }
    })
  }
  res.send(result);
})
app.get("/stationsLocate",function(req,res,next){
  res.send(stationsLocate);
})


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
