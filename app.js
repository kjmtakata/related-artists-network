var express = require('express');
var app = express();
var https = require("https");
var url = require("url");
var querystring = require("querystring");
var request = require("request");
var rp = require("request-promise-native");
var token = "test";
var port = process.env.PORT || 5000;
// var bodyParser = require('body-parser');

// returns promise of token response
var getToken = function() {
	var body = querystring.stringify({
		grant_type: "client_credentials"
	});

	return rp.post({
		url: 'https://accounts.spotify.com/api/token',
		auth: {
			user: process.env.SPOTIFY_CLIENT_ID,
			pass: process.env.SPOTIFY_CLIENT_SECRET
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

// tries api call with current token, if failed request new token and try again
var authGet = function(url, successCallback) {
	return rp.get({
		url: url,
		auth: {
			'bearer': token
		}
	}).then(successCallback).catch(function(response) {
		getToken().then(function() {
			authGet(url, successCallback);
		});
	});
};

app.use(express.static('public'));

// proxy requests to spotify api, add auth token to request
app.get("/spotify/\*", function(req, res) {
    var options = {
		host: 'api.spotify.com',
		path: '/v1/' + req.url.substring(9),
		headers: {
			'Authorization': "Bearer " + token
		}
    };

    authGet("https://api.spotify.com/v1/" + req.url.substring(9), function(response) {
    	res.send(response);
    });
});

app.listen(port, function () {
	console.log('app listening on port ' + port);
});
