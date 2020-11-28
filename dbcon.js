var mysql = require("mysql");
var pool = mysql.createPool({
    host: "classmysql.engr.oregonstate.edu",
    user: "cs361_<ONID>",
    password: "<password>",
    database: "cs361_<ONID>",
    dateStrings: 'true',
    typeCast: function castField(field, useDefaultTypeCasting) {
        if (field.type === "BIT" && field.length === 1) {
            var bytes = field.buffer()
            return (bytes === null) ? null : (bytes[0] === 1)
        }
        return useDefaultTypeCasting()
    }
});

module.exports.pool = pool
