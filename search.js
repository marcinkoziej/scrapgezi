var r = require('request'),
    qs = require('querystring'),
    async = require('async'),
    sinceId = 0;

var ara = {};

ara.search = function(q, max, callback) {
  var uri = 'http://search.twitter.com/search.json?';
  // todo: since id
  uri += qs.stringify({
    q: q,
    rpp: max
  });
  r({
    uri: uri, json: true
  }, callback);
};

ara.insert = function(db, tweet, callback) {
  db.insert(tweet, tweet.id_str, callback);
}

ara.persist = function(db, q, callback) {
  ara.search(q, 100, function(err, res, body) {
    if (err || !body) {
      console.log('error', err);
      callback(err, false);
      return;
    }
    since_id = body.max_id;
    var results = body.results || [];
    var tweets = db.use('direngezi');
    var inserts = [];
    for (var i in results) {
      inserts.push((function(item) {
        return function(done){
          item.tag = q;
          item.createdAt = new Date();
          ara.insert(tweets, item, done);
        }
      })(results[i]));
    }
    console.log('inserting for ', q, results.length);
    // persist
    async.parallel(inserts, callback);
  });
}

module.exports = ara;