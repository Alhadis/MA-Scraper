"use strict";

import Scraper     from "../app/scraper.js";
import Submission  from "./submission.js";
import Label       from "./label.js";
import Member      from "./member.js";
import User        from "./user.js";
import Vote        from "./vote.js";


class Band extends Submission{
	
	objectTypeID   = 1;
	objectTypeName = "band";
	
	
	/**
	 * Load the band's data from Metal Archives.
	 *
	 * @return {Promise}
	 */
	load(){
		return super.load([
			this.loadCore,
			this.loadPeripherals,
			this.loadMembers,
			this.loadReports,
			this.loadHistory,
			this.loadLinks,
			this.loadRecommendations
		]);
	}



	/**
	 * Loads the majority of the band's details.
	 *
	 * @return {Promise}
	 */
	loadCore(){
		this.log("Loading: Main data");
		let url = `http://www.metal-archives.com/band/edit/id/${this.id}`;

		return Scraper.getHTML(url).then(window => {
			this.log("Received: Main data");
			let promises    = [];
			
			let document    = window.document;
			let $           = s => document.querySelector(s);
			let optionText  = s => {
				let el = $(s);
				return el.options[el.selectedIndex].textContent;
			};
			
			/** Start pulling out vitals */
			this.name       = $("#bandName").value;
			this.genre      = $("#genre").value;
			this.status     = optionText("#status");
			this.country    = $("#country").value;
			this.location   = $("#location").value;
			this.aka        = $("#altSpell").value;
			this.themes     = $("#themes").value;
			this.formed     = $("#yearCreation").value;
			this.activity   = this.getActivityPeriods(window);
			this.unsigned   = $("#indieLabel_1").checked;
			this.logo       = ($(".band_name_img > a#logo") || {}).href;
			this.photo      = ($(".band_img > #photo")      || {}).href;
			this.notes      = $("textarea[name=notes]").value;
			this.evidence   = $("textarea[name=notesPending]").value;
			this.warning    = $("textarea[name=notesWarning]").value;
			this.modNotes   = $("textarea[name=notesModeration]").value;
			this.modStatus  = "accepted";
			this.rejection  = "";
			this.digital    = $("#acceptedAsDigital_1").checked;
			this.locked     = $("#lockedDisco_1").checked;
			
			
			/** Load any labels the band are signed to */
			let labels      = this.getLabels(window);
			if(labels.length){
				this.labels = labels;
				promises.push(...labels.map(l => l.load()));
			}
			
			this.log("Done: Main data");
			return Promise.all(promises);
		})
	}



	/**
	 * Load auxiliary band data not accessible from the edit page (e.g., timestamps)
	 *
	 * @return {Promise}
	 */
	loadPeripherals(){
		this.log("Loading: Peripherals");
		let url = `http://www.metal-archives.com/band/view/id/${this.id}`;

		return Scraper.getHTML(url).then(window => {
			this.log("Received: Peripherals");
			let promises = [];

			/** Load dates the band was last modified/created */
			promises.push(...(this.parseAuditTrail(window)));
			
			this.log("Done: Peripherals");
			return Promise.all(promises);
		});
	}
	
	
	
	/**
	 * Load bands that users have rated as similar to this one.
	 *
	 * @return {Promise}
	 */
	loadRecommendations(){
		this.log("Loading: Similar artists");
		let url = `http://www.metal-archives.com/recommendation/edit/bandId/${this.id}`;
		
		return Scraper.getHTML(url).then(window => {
			this.log("Received: Similar artists");
			let promises   = [];
			
			let document   = window.document;
			let $          = s => document.querySelector(s);
			let list       = $("#artist_list");
			
			
			/** There're no ratings here */
			if(!list) this.log("No artist recommendations found");
				
			/** Start going through all the recommended bands */
			else{
				let rows = Array.from(list.tBodies[0].rows);
				for(let r of rows)
					promises.push(this.getVotes(r));
			}
			
			this.log("Done: Similar artists");
			return Promise.all(promises);
		});
	}



	/**
	 * Load the artists who're listed in a band's line-up.
	 *
	 * @return {Promise}
	 */
	loadMembers(){
		return Promise.all([
			this::Member.loadLineup(Member.TYPE_MAIN),
			this::Member.loadLineup(Member.TYPE_LIVE)
		]);
	}



	/**
	 * Return a hash of activity periods from an "Edit Band" page.
	 *
	 * @param {Window} window
	 * @return {Object}
	 */
	getActivityPeriods(window){
		let document    = window.document;
		let periodNodes = document.querySelectorAll(`span[id^="bandActivity_"]`);
		let output      = {};

		Array.from(periodNodes).forEach(el => {
			let match      = el.id.match(/^bandActivity_(\d+)$/);
			if(match){
				let id     = match[1];
				let period = {}, v;
				
				if(v = el.querySelector(`input[name^="yearFrom"]`).value) period.from = v;
				if(v = el.querySelector(`input[name^="yearTo"]`).value)   period.to   = v;
				if(v = el.querySelector(`#asBandName_${id}`).value)       period.as   = v;
				if(v = el.querySelector(`#asBandId_${id}`).value)         period.band = v;
				output[id] = period;
			}
		});

		return output;
	}




	/**
	 * Extract any labels assigned in a band's "Edit" page.
	 *
	 * Currently, the site only permits one label to be assigned for each band.
	 * Because there's the possibility that multiple labels can be added to bands
	 * and albums in future, this method's written with multiple labels in mind.
	 *
	 * @param {Window} window
	 * @return {Array}
	 */
	getLabels(window){
		let output  = [];
		let labelId = parseInt(window.document.getElementById("labelId").value);

		if(labelId)
			output.push(new Label(labelId));

		return output;
	}
	
	
	
	/**
	 * Load the details of a single band recommendation.
	 *
	 * @param {HTMLElement} el - HTML row of the "Similar Artists" list containing the data
	 * @return {Promise}
	 */
	getVotes(el){
		let band = new Band(el.id.match(/_(\d+)$/)[1]);
		
		/** If this band's not been loaded yet, grab what data we can */
		if(!band.loaded){
			band.name    = el.cells[1].textContent;
			band.country = el.cells[2].firstElementChild.href.match(/\w+$/)[0];
			band.genre   = el.cells[3];
		}
		
		let url = `http://www.metal-archives.com/recommendation/ajax-user-votes/bandId/${this.id}/recBandId/${band.id}`;
		this.log("Loading: Users who recommend " + band.name);
		
		return Scraper.getHTML(url).then(window => {
			this.log("Received: Users who recommed " + band.name);
			let promises   = [];
			
			let document   = window.document;
			let pattern    = /^\s*The following user\(s\) voted (\w+)/i;
			let getVoters  = (users, score) => {
				for(let i of users){
					let user  = new User(i.textContent);
					promises.push(user.load().then(r => new Vote(user, [this.id, band.id], score)));
				}
			};
			
			for(let i of document.querySelectorAll("h5")){
				let next = i.nextElementSibling;
				switch((i.textContent.match(pattern) || [])[1]){
					case "FOR":      getVoters( next.querySelectorAll("a"),  1 ); break;
					case "AGAINST":  getVoters( next.querySelectorAll("a"), -1 ); break;
				}
			}
			
			return Promise.all(promises);
		});
	}
}

export default Band;
