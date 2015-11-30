"use strict";

/** Resource definitions */
import Resource  from "../resources/resource.js";
import Band      from "../resources/band.js";
import Artist    from "../resources/artist.js";
import Member    from "../resources/member.js";
import Release   from "../resources/release.js";
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
	 * @return {String}
	 */
	static JSON(){
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
			reviews:   null,
			reports:   $(Report),
			history:   $(Edit),
			recs:      $(Vote)
		};
		
		/** Run through the collected results once more and roast any empty arrays */
		let emptyProps = [];
		for(let i in result){
			let data = result[i];
			if(!data || "[]" === data || "null" === data)
				emptyProps.push(i);
		}
		
		for(let name of emptyProps)
			delete result[name];
		
		return JSON.stringify(result);
	}
}

export default Exporter;
