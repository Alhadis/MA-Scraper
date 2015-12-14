"use strict";

/** Resource definitions */
import Resource  from "../resources/resource.js";
import Band      from "../resources/band.js";
import Artist    from "../resources/artist.js";
import Member    from "../resources/member.js";
import Release   from "../resources/release.js";
import Review    from "../resources/review.js";
import Track     from "../resources/track.js";
import Link      from "../resources/link.js";
import Label     from "../resources/label.js";
import User      from "../resources/user.js";
import Report    from "../resources/report.js";
import Edit      from "../resources/edit.js";
import Vote      from "../resources/vote.js";



/**
 * Auxiliary class for handling the exporting of collected data.
 */
class Exporter{
	
	/**
	 * Export all loaded data as a JSON-encoded string.
	 *
	 * @param {Boolean} prettyPrint
	 * @return {String}
	 */
	static JSON(prettyPrint){
		let $ = o => o.toJSON();
		
		let result = {
			bands:     $(Band),
			artists:   $(Artist),
			members:   $(Member),
			releases:  $(Release),
			tracks:    $(Track),
			links:     $(Link),
			labels:    $(Label),
			users:     $(User),
			reviews:   $(Review),
			reports:   $(Report),
			history:   $(Edit),
			recs:      $(Vote)
		};
		
		/** Run through the collected results once more and roast any empty arrays */
		let emptyProps = [];
		for(let i in result){
			let data = result[i];
			if(!data || !Object.keys(data).length)
				emptyProps.push(i);
		}
		
		for(let name of emptyProps)
			delete result[name];
		
		return JSON.stringify(result, undefined, prettyPrint ? "\t" : undefined);
	}
}

export default Exporter;
