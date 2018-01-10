// app/routes.js

var fs = require('fs');
var express = require('express');
var request = require('request'); 
module.exports = function(app, passport) {

    // 首頁 ===============================

	app.get('/main', isLoggedIn, function(request, response){ //我們要處理URL為 "/" 的HTTP GET請求
		var path = '/../index.html';
		
		 response.render("index.ejs", { name: request.user.local.email });
		/*
		fs.readFile(__dirname + path, function(error, data){
			response.writeHead(200, {"Content-Type": "text/html"});
			response.write(data, "utf8");
			response.send('<p id="c">' + request.user.local.email + '</p>');
			console.log(request.user.local.email);
			//socket.emit('user_id',request.user.local.email);
			response.end();
		});*/
		
	});

    // 登入頁
    app.get('/', function(request, response) {
	
		response.render('index.ejs'); 
	/*
		var path = '/../login.html';
		fs.readFile(__dirname + path, function(error, data){
			response.writeHead(200, {"Content-Type": "text/html"});
			response.write(data, "utf8");
	response.end();
	});*/
    });

    // 處理登入
    app.post('/', passport.authenticate('local-login', {
        successRedirect : '/main', // 成功則導入main
        failureRedirect : '/',   // 失敗則返回登入頁 
        failureFlash : true // 允許 flash 訊息
    }));

    // 登出用
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });
	
	//--------其他網址---------------------
	app.get('/node_modules/*',function(request, response){ 
		var path = '/..'+request.url;
		fs.readFile(__dirname + path, function(error, data){
			//response.writeHead(200, {"Content-Type": "text/html"});
			response.write(data, "utf8");
			response.end();
		});
		
	});

  // 綁定本地帳戶 --------------------------------
	app.get('/connect/local', isLoggedIn, function(req, res) {
		res.render('connect-local.ejs', { message: req.flash('loginMessage') });
	});
	app.post('/connect/local', isLoggedIn, passport.authenticate('local-connect', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/connect/local', // redirect back to the signup page if there is an error
		failureFlash 	: true // allow flash messages
	}));

    // 註冊表單
    app.get('/signup', function(request, response) {
		response.render('signup.ejs',{ message: request.flash('signupMessage') }); 
    });

    // 處理註冊
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/main', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    // PROFILE =====================
    // 需要權限才能造訪的頁面我們就用 isLoggedIn function 來處理
    app.get('/profile', isLoggedIn, function(req, res) {
        res.render('profile.ejs', {
            user : req.user 
        });
    });
	// 帳號解除綁定 =============================================================
	// 社群帳號, 只移除token以方便日後要重新綁定
	// 本地帳號則會移除email & password
	
    // 本地帳號 -----------------------------------
    app.get('/unlink/local', function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

    // facebook -------------------------------
    app.get('/unlink/facebook', function(req, res) {
        var user            = req.user;
        user.facebook.token = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

   
    // 登出 ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });
};

// 處理權限
function isLoggedIn(req, res, next) {
	  if (req.isAuthenticated())
        return next();
    res.redirect('/');
}

function loggedInRedirect(req, res, next) {
	  if (!req.isAuthenticated())
        return next();
    res.redirect('/main');
}