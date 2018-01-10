
var ip   = "127.0.0.1",
    port = 1339,
    http = require('http');
var express = require('express');
var app = express();

var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');
var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');

//--------------------設定-------------------------
var configDB = require('./config/database.js');
mongoose.connect(configDB.userUrl); 
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'error connecting with mongodb database:'));
db.on('disconnected', function () {
   //Reconnect on timeout
   mongoose.connect(configDB.userUrl);
   db = mongoose.connection;
});


require('./config/passport')(passport); 

// 套入 express 的應用程式
//app.use(morgan('dev')); 		// 把每個請求都顯示在 console
app.use(cookieParser()); 		// 認證需要用到
app.use(bodyParser()); 			// 讀取 html 表格的資料(POST...etc)

app.set('view engine', 'ejs'); 	// 設定 ejs 為套用模版的引擎

// required for passport
app.use(session({ secret: 'imbigimbigimbigilovejulie' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session
app.use(express.static('files'));


// routes ======================================================================
require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport
app.use(express.static('public'));

var server = http.createServer(app);
require('./app/socketio.js')(server, configDB);

server.listen(port);
console.log('HTTP伺服器在 http://'+ip+':'+port+'/ 上運行');





