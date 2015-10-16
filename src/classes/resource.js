"use strict";

import Feedback from "./feedback.js";

let instances	= new Map();


class Resource{

	/**
	 * Returns an instance of this resource's subclassed type by ID.
	 *
	 * @param {String} id - Resource's unique identifier
	 * @return {Resource}
	 * @static
	 */
	static get(id){
		let list = instances.get(this) || {};
		return list[id];
	}


	/**
	 * Stores a globally-accessible reference to a resource instance
	 *
	 * @param {String}   id       - Resource's unique identifier
	 * @param {Resource} instance - Reference to the resource itself
	 * @static
	 */
	static add(id, instance){
		let list = instances.get(this);
		if(!list)
			instances.set(this, list = {});
		list[id] = instance;
	}


	/**
	 * Creates or returns a reference to a Resource object.
	 *
	 * If a resource of the same type and ID's been created, a reference to
	 * it's returned instead; this allows asynchronous collation of data.
	 *
	 * @param {String} id - Resource's unique identifier
	 * @constructor
	 */
	constructor(id, autoload = false){
		let type		= this.constructor;
		let byId		= type.get(id);

		if(byId){
			this.log("Already created. Reusing");
			return byId;
		}

		this.id = id;
		type.add(id, this);
		this.log("Created");
		
		/** Start loading the resource's data if told to */
		if(autoload) this.load();
	}


	/**
	 * Sends a string to the Feedback class for terminal display.
	 *
	 * @param {String} text
	 * @access private
	 */
	log(text){
		let type    = this.constructor.name.toLowerCase();
		let id      = this.id || this.name;
		Feedback.log(type, id, text);
	}



	/**
	 * Base method for pulling the resource's data from Metal Archives.
	 *
	 * This function is supposed to be overridden by a subclass; it does
	 * nothing on its own.
	 */
	load(){
		
	}
	
	
	/**
	 * Display the resource's JSON-encoded representation when stringified.
	 *
	 * @return {String}
	 */
	toString(){
		return JSON.stringify(this);
	}
}


export default Resource;
