var express = require('express');
var app = express();
var https = require("https");
var url = require("url");
var querystring = require("querystring");
// var bodyParser = require('body-parser');

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
			'Authorization': 'Basic ' + Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')
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

app.listen(8080, function () {
	console.log('app listening on port 8080!');
});
