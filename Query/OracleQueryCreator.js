var OracleQueryCreator = function(queryObject, oracleVersion){
	this.queryObject = queryObject;
	this.oracleVersion = oracleVersion;
	this.sqlString = "";
	this.countSqlString = "";
};	

OracleQueryCreator.prototype.createSelectQuery = function(){
	this.sqlString = "SELECT ";
	
	this.sqlString += addSelects(this.queryObject.select);
	this.sqlString += addFrom(this.queryObject.from);
	this.sqlString += addJoins(this.queryObject.join);
	this.sqlString += addWheres(this.queryObject.where);
	this.sqlString += addHavings(this.queryObject.having);
	this.sqlString += addGroups(this.queryObject.groupBy);
	this.sqlString += addOrders(this.queryObject.orderBy);
	this.countSqlString = createCountString(this.sqlString);
	this.sqlString =  addLimit(this.sqlString, this.queryObject.offset, this.queryObject.limit, this.oracleVersion);

	return {
		sqlString : this.sqlString,
		countString : this.countSqlString
	};
};

OracleQueryCreator.prototype.createCountQueryFromRaw = function(sqlString){
	return createCountString(sqlString);
};

/*
This function adds columns to select
 */
var addSelects = function(columns){
	if(!Array.isArray(columns))
		return "*";

	return columns.join();
};

/*
This function adds table to from
 */
var addFrom = function(fromObj){
	if(!fromObj.tableName)
		throw "Table name cannot be null.";

	var tmp = " FROM "+fromObj.tableName;

	if(fromObj.alias)
		tmp += " "+fromObj.alias;

	return tmp;
};

/*
This function adds where conditions
 */
var addWheres = function(filters){
	if(Array.isArray(filters) && filters.length > 0){
		var tmp = " WHERE ";
		for(var i = 0; i < filters.length; i++){
			if(i == 0)
				tmp += filters[i].filter;
			else
				tmp += " "+filters[i].condition+" "+filters[i].filter;
		}

		return tmp;
	}

	return "";
};

/*
This function adds having conditions
 */
var addHavings = function(filters){

	if(Array.isArray(filters) && filters.length > 0){
		var tmp = " HAVING ";
		for(var i = 0; i < filters.length; i++){
			if(i == 0)
				tmp += filters[i].filter;
			else
				tmp += " "+filters[i].condition+" "+filters[i].filter;
		}

		return tmp;
	}

	return "";
};

/*
This function adds join conditions
 */
var addJoins = function(joins){
	var tmp = "";

	if(Array.isArray(joins)){
		for(var i = 0; i < joins.length; i++){
			tmp += " "+joins[i].type+" JOIN "+joins[i].tableName+" "+joins[i].alias;
			if(joins[i].conditions)
				tmp += " ON "+joins[i].conditions;
		}
	}

	return tmp;
};

/*
This function adds group conditions
 */
var addGroups = function(groups){
	var tmp = "";
	
	if(Array.isArray(groups) && groups.length > 0)
		tmp = " GROUP BY "+groups.join();

	return tmp;
};

/*
This function adds order conditions
 */
var addOrders = function(orders){
	var tmp = "";

	if(Array.isArray(orders) && orders.length > 0){
		tmp = " ORDER BY ";
		var tmpArray = [];

		for(var i = 0; i < orders.length; i++){
			var tmpString = orders[i].column;

			if(orders[i].direction)
				tmpString += " "+orders[i].direction;

			tmpArray.push(tmpString);
		}

		tmp += tmpArray.join();
	}

	return tmp;
};

/*
This function set oracle style row limiting
 */
var addLimit = function(sql, offset, limit, oracleVersion){
	if(oracleVersion >= 1201000000){
      	// 12c row-limiting syntax
      	if(offset)
      		sql += " OFFSET "+offset+" ROWS";
      	if(limit)
      		sql += " FETCH NEXT "+limit+" ROWS ONLY";
    }else{
      	// Pre-12c syntax [could also customize the original query and use row_number()]
      	if(offset && !limit)
			sql = "SELECT * FROM (SELECT a.*, rownum as outer_rownum FROM (" + sql + ") A ) WHERE outer_rownum > "+offset;
      	else if(!offset && limit)
      		sql = "SELECT a.*, rownum as outer_rownum FROM (" + sql + ") A WHERE rownum <= "+limit;
      	else if(offset && limit)
      		sql = "SELECT * FROM (SELECT a.*, rownum as outer_rownum FROM (" + sql + ") A WHERE rownum <= "+limit+") WHERE outer_rownum > "+offset;
    }

    return sql;
};

var createCountString = function(sqlString){
	return "SELECT COUNT(*) as CNT FROM ("+sqlString+")";
}

module.exports = OracleQueryCreator;