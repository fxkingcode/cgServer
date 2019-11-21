var express = require('express');
var app = express ();

const bodyParser = require('body-parser');
var server = app . list ( 3000 );

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

console.log("signUp");

app.post('/signUp.js', (req, res) => {
	var data = req.body.Email; // your data
  console.log("Email : ", req.body.Email);
    // do something with that data (write to a DB, for instance)
	res.status(200).json({
		message: "Data received successfully"
	});
});
