"use strict";

import Resource from "./resource.js";


/**
 * Represents a single track on a release.
 */
class Track extends Resource{

	/**
	 * Populate the Track instance with supplied data.
	 *
	 * @param {Object} args - Hash of properties supplied by a Release instance's loadCore method.
	 * @return {Promise}
	 */
	load(args){
		this.name          = args.name;
		this.length        = args.length;
		this.lyrics        = args.lyrics;
		this.instrumental  = args.instrumental;
		this.bonus         = args.bonus;
		this.release       = args.release;
		this.index         = args.index;
		this.disc          = args.disc;
		this.band          = args.band;
		this.side          = args.side;
		
		if(!this.band) delete this.band;
		if(!this.side) delete this.side;
		return Promise.resolve();
	}
	
	
	/**
	 * Return a JSON-friendly representation of this track's data.
	 *
	 * @param {String} property
	 * @return {Object}
	 */
	toJSON(property){
		if(property) return super.toJSON(property);
		
		let result = {};
		if(this.name)          result.name         = this.name;
		if(this.length)        result.length       = this.length;
		if(this.lyrics)        result.lyrics       = this.lyrics;
		if(this.instrumental)  result.instrumental = true;
		if(this.bonus)         result.bonus        = true;
		if(this.release)       result.release      = this.release;
		if(this.index)         result.index        = this.index;
		if(this.disc)          result.disc         = this.disc;
		if(this.band)          result.band         = this.band;
		if(this.side)          result.side         = this.side;
		
		return result;
	}
}


export default Track;
