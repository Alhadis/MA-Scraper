"use strict";

import Resource from "./resource.js";


class Vote extends Resource{
	
	/**
	 * Represents a single user who voted for/against a comparison between two bands.
	 *
	 * @param {User}   user  - Person who cast this vote
	 * @param {Array}  bands - Array of bands being compared
	 * @param {Number} score - Positive or negative integer representing user's opinion
	 * @constructor
	 */
	constructor(user, bands, score){
		
		/** Make sure band IDs are sorted in ascending numeric order */
		let bandIDs = bands.sort((a, b) => {
			let A = parseInt(a);
			let B = parseInt(b);
			if(A < B) return -1;
			if(A > B) return 1;
			return 0;
		});
		
		/** Concatenate an awkward ID cobbled together from the user and bands in question */
		super((user.name || user.id) + ": " + bandIDs.join(", "));
		
		this.user  = user;
		this.bands = bands;
		this.score = score;
	}
	
	
	
	/**
	 * Return a JSON-optimised representation of the band recommendations's stats.
	 *
	 * Which, given the lack of everything due to not having normative IDs, is just a number.
	 *
	 * @param {String} property
	 * @return {Object}
	 */
	toJSON(property){
		return this.score;
	}
	
	
	
	/**
	 * Export an ordered, JSON-friendly representation of every band similarity vote cast by a user.
	 *
	 * @return {Object}
	 */
	static toJSON(){
		let items     = [];
		let instances = this.getAll();
		for(let i in instances)
			items.push({
				id:   instances[i].id,
				data: instances[i].toJSON()
			});
		
		/** Order results alphabetically */
		items.sort((a, b) => {
			if(a.id < b.id) return -1;
			if(a.id > b.id) return 1;
			return 0;
		});
		
		let results = {};
		for(let i of items)
			results[i.id] = i.data;
		return results;
	}
}


export default Vote;
