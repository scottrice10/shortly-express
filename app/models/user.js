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
      var user = model.get("username");
      var hash = bcrypt.hashSync(password);
      this.set("password", hash);
    });
  }
});

module.exports = User;