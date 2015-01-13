var db = require('../config');
var Promise = require('bluebird');
var bcrypt = require('bcrypt');

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,
  initialize: function() {
    this.on('creating', this.hashPassword, this);
  },
  hashPassword: function() {
    var hash = Promise.promisify(bcrypt.hash, bcrypt);
    return hash('bacon', 8).bind(this).then(function(err, hash) {
      this.set('password', hash);
    });
  }
});

module.exports = User;
