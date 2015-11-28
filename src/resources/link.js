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
	
}


export default Link;
