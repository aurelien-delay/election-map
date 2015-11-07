var path = require('path');

module.exports = function(app) {
    app.get('*', helloWorld);
};

function helloWorld (req, res)
{
    res.sendFile('index.html', { root: path.join(__dirname, '../public') });
}
