var mysql = require("mysql");	
var pool = mysql.createPool({	
    host: "classmysql.engr.oregonstate.edu",	
    user: "<onid>_cs361",	
    password: "<password>",	
    database: "<onid>_cs361",	
    dateStrings: 'true',	
    typeCast: function castField(field, useDefaultTypeCasting) {	
        if (field.type === "BIT" && field.length === 1) {	
            var bytes = field.buffer();	
            return (bytes[0] === 1);	
        }	
        return useDefaultTypeCasting();	
    }	
});	

module.exports.pool = pool; 
