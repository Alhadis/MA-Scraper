"use strict";

import Scraper     from "../app/scraper.js";
import Submission  from "./submission.js";
import Band        from "./band.js";
import Member      from "./member.js";


class Artist extends Submission{
	
	objectTypeID = 3;
	
	
	/**
	 * Loads this artist's data from Metal Archives.
	 *
	 * @param {Boolean} saveListedBands - If TRUE, will list each band/release the artist's credited in.
	 * @return {Promise}
	 */
	load(saveListedBands){
		this.saveListedBands = !!saveListedBands;
		return super.load([
			this.loadCore,
			this.loadPeripherals,
			this.loadReports,
			this.loadHistory
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
			this.log("Done: Main data");
		});
	}



	loadPeripherals(){
		this.log("Loading: Peripherals");
		let url = `http://www.metal-archives.com/artist/view/id/${this.id}`;
		
		return Scraper.getHTML(url).then(window => {
			this.log("Received: Peripherals");
			let promises = [];
			
			/** Load involvements in other bands */
			promises.push(this.loadBands(window, this.saveListedBands));
			
			/** Load the usual audit trail, etc */
			promises.push(...(this.parseAuditTrail(window)));
			
			this.log("Done: Peripherals");
			return Promise.all(promises);
		});
	}
	
	
	
	/**
	 * Load the artist's involvement in other bands and recordings.
	 *
	 * By default, the method's behaviour is to only save/load involvement in
	 * unlisted bands/projects. This can be overridden by setting saveAll to
	 * a truthy value.
	 *
	 * @param {Window}  window   - DOM window
	 * @param {Boolean} saveAll  - Save listed involvements as well as unlisted
	 * @return {Promise}
	 */
	loadBands(window, saveAll){
		let promises = [];
		let document = window.document;
		let members  = document.querySelectorAll(".member_in_band");
		
		let loadReleases = el => {
			let releases = el.querySelectorAll("tr[id^='memberInAlbum_']");
			if(releases.length){
				for(let r of releases){
					let memberID = r.innerHTML.match(/return deleteMember\((\d+)\)/)[1];
					promises.push(new Member(memberID).load());
				}
			}
		};
		
		
		/** Loop through each band listed on the artist's profile */
		for(let i of members){
			let bandName = i.querySelector(".member_in_band_name");
			let bandLink = bandName.getElementsByTagName("a");


			/** This is an unlisted band */
			if(!bandLink.length){
				let roleID = (i.innerHTML.match(/metal-archives\.com\/lineup\/edit-roles\/id\/(\d+)/i) || {})[1];
				if(roleID) promises.push(new Member(roleID).load());
				loadReleases(i);
			}
			
			
			/** This band's listed in the Encyclopaedia, and we've chosen to scrape everything */
			else if(saveAll){
				let bandID   = bandLink[0].href.match(/\/(\d+)(?:#[^#"]+)?/)[1];
				let band     = Band.get(bandID);

				/** Create extremely minimal entries for new bands; just enough to show them on the artist's profile */
				if(!band){
					band       = new Band(bandID);
					band.name  = bandLink[0].textContent.trim();
				}


				/** Artist's listed in the band's main line-up */
				let toolStrip = i.querySelector(".tool_strip");
				if(toolStrip){
					let source    = toolStrip.innerHTML;
					let memberID  = (source.match(/return deleteMember\((\d+)\);/) || {})[1];
					
					
					/** We can access the involvement's ID directly */
					if(memberID)
						promises.push(new Member(memberID, band).load());


					/** Otherwise, it has to be scraped from the line-up's "Edit" page */
					else{
						this.log(`Loading full line-up data for ${band.name}`);
						let url = `http://www.metal-archives.com/lineup/edit-artists/bandId/${bandID}/typeId/1/releaseId/0`;

						promises.push(Scraper.getHTML(url).then(window => {
							let promises  = [];
							let document  = window.document;
							let roles     = document.querySelectorAll("tr[id^='artist_']");
							
							for(let row of roles){
								let artistLink = row.querySelector(`a[href$="metal-archives.com/artist/edit/id/${this.id}"]`);
								if(artistLink){
									let id       = row.id.match(/_(\d+)$/)[1];
									let roles    = document.querySelector("#roleList_" + id);
									promises.push( new Member(id, band).load([row, roles]) );
									break;
								}
							}
							
							return Promise.all(promises);
						}));
					}
				}
			
			
				/** Artist's credited in one or more releases by this band */
				loadReleases(i);
			}
		}
		
		return Promise.all(promises);
	}
}

export default Artist;
