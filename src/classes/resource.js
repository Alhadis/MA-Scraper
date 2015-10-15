"use strict";

let instances	= new Map();


class Resource{

	/**
	 * Returns an instance of this resource's subclassed type by ID.
	 *
	 * @param {Number} id - Resource's unique identifier
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
	 * @param {Number}   id       - Resource's unique identifier
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
	 * @param {Number} id - Resource's numeric identifier
	 * @constructor
	 */
	constructor(id, autoload = true){
		let type		= this.constructor;
		let byId		= type.get(id);
		let typeName	= type.name.toLowerCase();

		if(byId){
			console.log(`Reusing ${typeName} # ${id}`);
			return byId;
		}

		console.log(`Created ${typeName} # ${id}`);
		this.id = id;
		type.add(id, this);
		
		/** Start loading the resource's data if permitted to */
		if(autoload) this.load();
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
