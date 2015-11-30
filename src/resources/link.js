"use strict";

import Resource from "./resource.js";


class Link extends Resource{
	
	/**
	 * Represents a single entry in a Submission instance's "Related Links" tab.
	 *
	 * @param {Object} args - Hash of link-related properties
	 * @constructor
	 */
	constructor(args){
		super(args.id);
		
		this.id   = args.id;
		this.name = args.name;
		this.url  = args.url;
		this.type = args.type;
		this.for  = args.for;
	}
	
	
	/**
	 * Return a JSON-optimised representation of the Link's data.
	 *
	 * @param {String} property
	 * @return {Object}
	 */
	toJSON(property){
		if(property) return super.toJSON(property);
		
		let result   = {};
		if(this.name)  result.name  = this.name;
		if(this.url)   result.url   = this.url;
		if(this.type)  result.type  = this.type;
		if(this.for)   result.for   = this.for;
		if(this.added) result.added = this.added;
		return result;
	}
}


export default Link;
