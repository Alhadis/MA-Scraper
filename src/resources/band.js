"use strict";

import Scraper     from "../app/scraper.js";
import Submission  from "./submission.js";
import Release     from "./release.js";
import Label       from "./label.js";
import Member      from "./member.js";
import User        from "./user.js";
import Vote        from "./vote.js";
import File        from "./file.js";


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
			this.loadDiscography,
			this.loadHistory,
			this.loadLinks,
			this.loadRecommendations
		]);
	}



	/**
	 * Load the majority of the band's details.
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
			this.logo       = new File(($(".band_name_img > a#logo") || {}).href);
			this.photo      = new File(($(".band_img > #photo")      || {}).href);
			this.notes      = $("textarea[name=notes]").value;
			this.evidence   = $("textarea[name=notesPending]").value;
			this.warning    = $("textarea[name=notesWarning]").value;
			this.modNotes   = $("textarea[name=notesModeration]").value;
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

			/** Get the band's creation/modification details */
			promises.push(this.parseAuditTrail(window));
			
			
			/** Ascertain the band's moderation status */
			this.modStatus  = "approved";
			let html        = window.document.documentElement.innerHTML;
			let match       = html.match(/\n\t{5}var message = '(.+?)\n\t{3}outputErrors\(\{ status: message\}, '#message'\);/m);
			
			/** Check if there's an approval-status message on the page */
			if(match){
				let message = match[1];
				let input   = match.input;
				
				if(/^This band is still pending approval/.test(message))                      this.modStatus = "pending";
				else if(/^This band is currently in the submitter\\'s drafts/.test(message))  this.modStatus = "draft";
				else if(match = message.match(/^This band has been (deleted|rejected)/))      this.modStatus = match[1];
				else console.warn(`Unusual input for rejection status:\n${input}`);
				
				
				/** Look for any deletion/rejection reasons, too */
				let reason;
				if(this.modStatus      === "deleted")  reason = input.match(/reason given: "(.*?)"\) and will probably be purged soon/mi)[1];
				else if(this.modStatus === "rejected") reason = input.match(/the following reason:<p>"<em>(.*?)"<\/em><\/p>/mi)[1];
				
				/** Did we find one? */
				if(reason)
					this.rejection = reason.replace(/\\{2}/g, "\\").replace(/\\'/g, "'").replace(/<br\s*\/?>/gi, "\n");
			}
			
			
			
			this.log("Done: Peripherals");
			return Promise.all(promises);
		});
	}
	
	
	
	/**
	 * Load the band's discography.
	 *
	 * @return {Promise}
	 */
	loadDiscography(){
		this.log("Loading: Discography");
		let url = `http://www.metal-archives.com/band/discography/id/${this.id}/tab/all`;
		
		return Scraper.getHTML(url).then(window => {
			this.log("Received: Discography");
			let promises = [];
			
			let document    = window.document;
			let releaseRows = document.querySelectorAll(".discog > tbody > tr");
			for(let i of Array.from(releaseRows)){
				let id      = i.querySelector(".ui-icon-pencil").parentNode.href.match(/\/(\d+)$/)[1];
				let release = new Release(id);
				promises.push(release.load());
			}
			
			this.log("Done: Discography");
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
			band.genre   = el.cells[3].textContent;
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
	
	
	/**
	 * Return a JSON-friendly representation of the band's data.
	 *
	 * @param {String} property
	 * @return {Object}
	 */
	toJSON(property){
		if(property) return super.toJSON(property);
		
		let result               = {};
		let haveActivity         = this.activity && Object.keys(this.activity).length;
		let haveLabels           = this.labels   && this.labels.length;
		
		if(this.name)            result.name       = this.name;
		if(this.genre)           result.genre      = this.genre;
		if(this.status)          result.status     = this.status;
		if(this.country)         result.country    = this.country;
		if(this.location)        result.location   = this.location;
		if(this.aka)             result.aka        = this.aka;
		if(this.themes)          result.themes     = this.themes;
		if(this.formed)          result.formed     = this.formed;
		if(haveActivity)         result.activity   = this.activity;
		if(this.unsigned)        result.unsigned   = true;
		if(haveLabels)           result.labels     = this.labels;
		if(this.logo)            result.logo       = this.logo;
		if(this.photo)           result.photo      = this.photo;
		if(this.notes)           result.notes      = this.notes;
		if(this.evidence)        result.evidence   = this.evidence;
		if(this.warning)         result.warning    = this.warning;
		if(this.modNotes)        result.modNotes   = this.modNotes;
		if(this.modStatus)       result.modStatus  = this.modStatus;
		if(this.rejection)       result.rejection  = this.rejection;
		if(this.digital)         result.digital    = true;
		if(this.locked)          result.locked     = true;
		
		return Object.assign(result, super.toJSON());
	}
}

export default Band;
