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
	}
}


export default Track;
