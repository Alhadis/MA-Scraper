"use strict";

import Scraper     from "./scraper.js";
import Submission  from "./submission.js";
import Label       from "./label.js";
import Member      from "./member.js";


class Band extends Submission{

	load(){
		return super.load([
			this.loadCore,
			this.loadPeripherals,
			this.loadMembers
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
				Promise.all(labels.map(l => l.load()));
			}
		})
	}



	/**
	 * Loads auxiliary band data not accessible from the edit page (e.g., timestamps)
	 *
	 * @return {Promise}
	 */
	loadPeripherals(){
		this.log("Loading: Peripherals");
		let url = `http://www.metal-archives.com/band/view/id/${this.id}`;

		return Scraper.getHTML(url).then(window => {
			this.log("Received: Peripherals");

			/** Load dates that the resource was last modified/created */
			let promises = this.parseAuditTrail(window);

			/** Load the data of any users mentioned in the page's footer */
			if(promises.length)
				return Promise.all(promises);
		});
	}



	/**
	 * Load the artists who're listed in a band's line-up.
	 *
	 * @return {Promise}
	 */
	loadMembers(){
		this.log("Loading: Members/Line-up");
		let url = `http://www.metal-archives.com/lineup/edit-artists/bandId/${this.id}/typeId/1/releaseId/0`;
		
		return Scraper.getHTML(url).then(window => {
			this.log("Received: Members/Line-up");

			let promises  = Promise.resolve();
			let document  = window.document;
			let roles     = document.querySelectorAll("tr[id^='artist_']");

			for(let row of roles){
				let id       = row.id.match(/_(\d+)$/)[1];
				let roles    = document.querySelector("#roleList_" + id);
				promises.then( new Member(id).load([row, roles]) );
			}
			
			return promises;
		});
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
}

export default Band;
