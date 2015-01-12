var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,
  //clicks: function() {
    //return this.hasMany(Click);
  //},
  initialize: function(options, cb){
    this.on('creating', function(model, attrs, options){
      var password = model.get("password");
      //return new Promise(function(resolve, reject) {
      	bcrypt.hash(password, null, null, function(err, hash) {
          console.log("--> " + hash);
          cb(hash);
          //model.set("password", hash);
          //then when creating new user;
        });
      //});
      //var shasum = crypto.createHash('sha1');
      //shasum.update(model.get('url'));
      //model.set('code', shasum.digest('hex').slice(0, 5));
    });
  }
});

module.exports = User;