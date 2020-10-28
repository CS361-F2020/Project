var mysql = require("mysql");	
var pool = mysql.createPool({	
    host: "classmysql.engr.oregonstate.edu",	
    user: "cs361_koeplinm",	
    password: "5391",	
    database: "cs361_koeplinm",	
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
