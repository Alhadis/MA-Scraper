"use strict";

/**
 * Represents a timestamped action performed by a user
 */
class TimeStamp{

	constructor(args){
		this.date	= args.on;
		this.user	= args.by;
		this.ip		= args.ip;
	}

	get date(){ return this._date; }
	set date(i){ this._date = i ? new Date(i) : null; }
}


/**
 * Represents an individual comment/action logged in a report thread
 */
class ReportComment extends TimeStamp{
	
	constructor(args){
		super(args);
		this.text		= args.text;
		this.evidence	= args.evidence;
	}
	
}




/**
 * Represents a link to another data entity.
 */
class ObjRef{

	constructor(args, expectedType){
		
		/** Allow object IDs to be passed directly, assuming expectedType is specified */
		if("number" === typeof args) args = {id: args};

		/** Also allow references to be specified in array form: [id, type] */
		else if(Array.isArray(args)) args = {id: args[0], type: args[1]};

		this.id		= args.id;
		this.type	= args.type || expectedType;
	}


	get type(){ return this._type; }
	set type(i){
		let types = {
			band: 1,
			label: 2,
			artist: 3,
			release: 4
		};

		this._type = i in types ? types[i] : i;
	}
}


/** Export class definitions for Node.js */
if("object" === typeof module && module.exports){
	module.exports	= {
		TimeStamp,
		ReportComment,
		ObjRef
	}
}
