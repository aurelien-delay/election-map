var path = require('path');

module.exports = function(app) {
    app.get('/carte_election_antibes', DisplayElectionMap);
};

function DisplayElectionMap (req, res)
{
    // --- Forward towards index.html (angular page) ---
    res.sendFile('index.html', { root: path.join(__dirname, '../public') });
}
