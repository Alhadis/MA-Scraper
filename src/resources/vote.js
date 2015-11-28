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
		super(user.id + ": " + bandIDs.join(", "));
		
		this.user  = user;
		this.bands = bands;
		this.score = score;
	}
	
}


export default Vote;
