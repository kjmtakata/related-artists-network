var express = require('express');
var app = express();
var https = require("https");
var url = require("url");
var querystring = require("querystring");
var request = require("request");
var rp = require("request-promise-native");
var token = "test";
// var bodyParser = require('body-parser');

// returns promise of token response
var getToken = function() {
	// console.log("getToken");
	var body = querystring.stringify({
		grant_type: "client_credentials"
	});

	// var options = {
	// 	url: 'https://accounts.spotify.com/api/token',
	// 	headers: {
	// 		// 'Content-Type': 'application/x-www-form-urlencoded',
	// 		// 'Content-Length': Buffer.byteLength(body),
	// 		//'Authorization': 'Basic ' + Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')
	// 		'Authorization': 'Basic OTA3NjBmYjQ1ZTc0NGI5OTkxMGU4OTVjYjFmM2IwNTg6ZjA3NTdhMjY0NjA1NGUyNjkzMzU4YzJkNTdmNzc5NDI='
	// 	}
	// };

	return rp.post({
		url: 'https://accounts.spotify.com/api/token',
		auth: {
			user: '90760fb45e744b99910e895cb1f3b058',
			pass: 'f0757a2646054e2693358c2d57f77942'
		},
		form: {
			grant_type: "client_credentials"
		}
	}).then(function(body) {
		var body = JSON.parse(body);
		token = body.access_token;
		console.log(body);
	});
};

var authGet = function(url, successCallback) {
	// console.log("auth get");
	return rp.get({
		url: url,
		auth: {
			'bearer': token
		}
	}).then(successCallback).catch(function(response) {
		// console.log("error", response);
		// console.log("bad access token");
		getToken().then(function() {
			// console.log("after get token");
			authGet(url, successCallback);
		});
	});
};

// getToken().then(function(body) {
// 	var body = JSON.parse(body);
// 	token = body.access_token;
// 	console.log(body);
// });

app.use(express.static('public'));

app.get("/token", function (req, res) {
	var body = querystring.stringify({
		grant_type: "client_credentials"
	});

	var options = {
		host: 'accounts.spotify.com',
		port: '443',
		path: '/api/token',
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': Buffer.byteLength(body),
			//'Authorization': 'Basic ' + Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')
			'Authorization': 'Basic OTA3NjBmYjQ1ZTc0NGI5OTkxMGU4OTVjYjFmM2IwNTg6ZjA3NTdhMjY0NjA1NGUyNjkzMzU4YzJkNTdmNzc5NDI='
		}
	};

	var postreq = https.request(options, function(response) {
		response.on('data', function(d) {
			res.write(d);
		});
		response.on('end', function() {
			res.end();
		});
	}).on('error', function(e) {
		console.error(e);
	});
	postreq.write(body);
	postreq.end();
});

app.get("/spotify/\*", function(req, res) {
    var options = {
		host: 'api.spotify.com',
		path: '/v1/' + req.url.substring(9),
		headers: {
			'Authorization': "Bearer " + token
		}
    };
    // console.log(req);
    // console.log(options);

    authGet("https://api.spotify.com/v1/" + req.url.substring(9), function(response) {
    	res.send(response);
    });

	// var getreq = https.get(options, function(response) {
	// 	response.on('data', function(d) {
	// 		res.write(d);
	// 	});
	// 	response.on('end', function() {
	// 		res.end();
	// 	});
	// 	response.on('error', function(e) {
	// 		console.error(e);
	// 	});
 //    }).on('error', function(e) {
	// 	console.error(e);
	// });
});

app.listen(8081, function () {
	console.log('app listening on port 8081!');
});
