// set up ======================================================================
var express  = require('express');
var app      = express();
var port     = process.env.PORT || 8080;


// configuration ===============================================================


// routes ======================================================================
require('./app/routes.js')(app);


// listen (start app with node server.js) ======================================
app.listen(port);
console.log("App listening on port " + port);
