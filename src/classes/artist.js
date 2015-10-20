"use strict";

import Scraper     from "./scraper.js";
import Submission  from "./submission.js";


class Artist extends Submission{
	
	load(){
		return super.load([
			this.loadCore,
			this.loadPeripherals
		]);
	}
	
	
	
	/**
	 * Load the majority of the artist's details.
	 *
	 * @return {Promise}
	 */
	loadCore(){
		this.log("Loading: Main data");
		let url = `http://www.metal-archives.com/artist/edit/id/${this.id}`;
		
		return Scraper.getHTML(url).then(window => {
			this.log("Received: Main data");
			
			let document  = window.document;
			let $         = s => document.querySelector(s);
			
			/** Assign vitals */
			this.alias    = $("#alias").value;
			this.name     = $("#fullName").value;
			this.born     = this.parseDate(window, "#birthDateDay", "#birthDateMonth", "#birthDateYear");
			this.died     = $("#deathDateUnknown").checked ? "Unknown" : this.parseDate(window, "#deathDateDay", "#deathDateMonth", "#deathDateYear");
			this.diedOf   = $("#deathCause").value;
			this.country  = $("#country").value;
			this.location = $("#location").value;
			this.gender   = $("input[name='gender']:checked").value;
			this.photo    = ($("#artist") || {}).href;
			this.bio      = $("textarea[name='biography']").value;
			this.notes    = $("textarea[name='trivia']").value;
			this.warning  = $("textarea[name='notesWarning']").value;
		});
	}



	loadPeripherals(){
		this.log("Loading: Peripherals");
		let url = `http://www.metal-archives.com/artist/view/id/${this.id}`;
		
		return Scraper.getHTML(url).then(window => {
			this.log("Received: Peripherals");
			
			/** Load the usual audit trail, etc */
			let promises = this.parseAuditTrail(window);
			if(promises.length)
				return Promise.all(promises);
		});
	}
}

export default Artist;
