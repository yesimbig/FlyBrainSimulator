// app/models/user.js
// 載入需要的東西
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// 定義欄位
var userSchema = mongoose.Schema({

    local            : {
        email        : String,
        password     : String,
    },
    facebook         : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    }
});

// methods ======================
// 加密
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// 核對密碼
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};


module.exports = mongoose.model('User', userSchema);