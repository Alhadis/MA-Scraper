"use strict";

import Resource  from "./resource.js";
import Label     from "./label.js";
import Scraper   from "./scraper.js";
import User      from "./user.js";


class Band extends Resource{

	load(){
		this.log("Load started");
		return Promise.all([
			this.loadCore(),
			this.loadPeripherals()
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
			this.labels     = this.getLabels(window);
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
			let promises = [];
			let document = window.document;
			let $        = s => document.querySelector(s);

			/** Load dates that the resource was last modified/created */
			let trail    = this.parseAuditTrail(window);

			if(trail.added){
				this.added = trail.added;
				let by     = this.added.by;
				if(by){
					by = new User(by);
					promises.push(by.load());
					this.added.by = by;
				}
			}

			if(trail.modified){
				this.modified = trail.modified;
				let by        = this.modified.by;
				if(by){
					by = new User(by);
					promises.push(by.load());
					this.modified.by = by;
				}
			}
			
			
			if(promises.length)
				return Promise.all(promises);
		})
	}



	/**
	 * Pull creation/modification times from the page's footer.
	 *
	 * @param {Window} window
	 * @return {Object}
	 */
	parseAuditTrail(window){
		let trail       = window.document.getElementById("auditTrail");
		let rows        = trail.querySelectorAll("tr");

		let userLink    = "a.profileMenu";
		let rTimeStamp  = /(^((?:Last\s*)?Modified|Added)\s+on:\s*|N\/A\s*$)/gi;
		let by, on, info;
		let output = {};
		
		/** "Added by" / "Added on" */
		by = (rows[0].children[0].querySelector(userLink) || {}).textContent;
		on = rows[1].children[0].textContent.replace(rTimeStamp, "");
		if(by || on){
			info = {};
			if(by) info.by = by;
			if(on) info.on = on;
			output.added   = info;
		}


		/** "Modified by" / "Last modified on" */
		by = (rows[0].children[1].querySelector(userLink) || {}).textContent;
		on = rows[1].children[1].textContent.replace(rTimeStamp, "");
		if(by || on){
			info = {};
			if(by) info.by  = by;
			if(on) info.on  = on;
			output.modified = info;
		}
		

		/** Check if there're any reports */
		output.haveReports = !!trail.querySelector(`a[href*="/report/by-object/"]`);

		return output;
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

		if(labelId){
			output.push(labelId);
			new Label(labelId);
		}
		return output;
	}
}

export default Band;
