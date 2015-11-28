"use strict";

import Feedback from "../app/feedback.js";

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
	 * Return a list of every instance created with this resource type.
	 *
	 * @return {Array}
	 * @static
	 */
	static getAll(){
		return instances.get(this) || {};
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


	/** List every Resource instance that's been created. Intended for debugging. */
	static list(){
		let entries = instances.entries();
		for(let e of entries)
			console.log(util.inspect(e, {depth: 5}));
	}


	/**
	 * Creates or returns a reference to a Resource object.
	 *
	 * If a resource of the same type and ID's been created, a reference to
	 * it's returned instead; this allows asynchronous collation of data.
	 *
	 * @param {String} id        - Resource's unique identifier
	 * @param {Boolean} autoload - Begin loading the resource's data after creation
	 * @constructor
	 */
	constructor(id, autoload = false){
		let type		= this.constructor;
		let byId		= type.get(id);

		if(byId){
			byId.log("Already created. Reusing");
			return byId;
		}

		this.id = id;
		type.add(id, this);
		this.log("Created");
		
		/** Start loading the resource's data if told to */
		if(autoload) this.load();
	}



	/**
	 * Base method for pulling the resource's data from Metal Archives.
	 *
	 * @param {Array} callbacks - Array of functions to resolve into Promises
	 * @return {Promise}
	 */
	load(callbacks = []){
		let promises = [];

		if(!this.loaded){
			this.log("Load started");
			this.loaded = true;
			promises = callbacks.map(o => this::o());
		}

		else this.log("Already loaded");
		return Promise.all(promises);
	}



	/**
	 * Sends a string to the Feedback class for terminal display.
	 *
	 * @param {String} text
	 * @access private
	 */
	log(text){
		Feedback.log(this, text);
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
