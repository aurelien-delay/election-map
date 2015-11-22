// set up ======================================================================
var express  = require('express');
var app      = express();
var port     = process.env.PORT || 80;

console.log(process.env);


// configuration ===============================================================
app.use(express.static(__dirname + '/public')); 		// set the static files location. e.g. /public/img will be /img for users

// routes ======================================================================
require('./app/routes.js')(app);


// listen (start app with node server.js) ======================================
app.listen(port);
console.log("App listening on port " + port);
