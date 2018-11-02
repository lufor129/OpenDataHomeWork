var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

const fs = require('fs');
let all = fs.readFileSync("./All_Station.txt",'utf8');
let stations= [];
all.split(/\n/).forEach(line=>{
  let temp = line.split("_");
  stations.push({
    [temp[1]]:temp[0]
  });
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
  if(temp = ""){
    res.send(["沒有","這個","測站"]);
  }else{
    var result = require(`./homework/${temp}.json`);
    res.send(result);
  }
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
