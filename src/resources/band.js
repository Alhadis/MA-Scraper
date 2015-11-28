"use strict";

import Scraper     from "../app/scraper.js";
import Submission  from "./submission.js";
import Label       from "./label.js";
import Member      from "./member.js";
import Link        from "./link.js";


class Band extends Submission{
	
	objectTypeID = 1;
	
	
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
			this.loadLinks
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

			/** Load dates the band was last modified/created */
			promises.push(...(this.parseAuditTrail(window)));
			
			this.log("Done: Peripherals");
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
	 * Load the band's "Related Links" section
	 *
	 * @return {Promise}
	 */
	loadLinks(){
		this.log("Loading: Links");
		let url = `http://www.metal-archives.com/link/ajax-list/type/band/id/${this.id}`;
		
		return Scraper.getHTML(url).then(window => {
			this.log("Received: Links");
			let promises     = [];
			
			let document     = window.document;
			let $            = s => document.querySelector(s);
			let $$           = s => document.querySelectorAll(s);

			/** Get a list of every category we have links for */
			let categoryList = $$("#band_links > ul a");
			for(let i of categoryList){
				let type     = i.textContent;
				
				/** Fetch the links for this category */
				let block    = $("#" + i.href.match(/#(.+)$/)[1]);
				let table    = block.querySelector("table[id^='linksTable']");
				
				for(let r of Array.from(table.rows)){
					let id   = +r.cells[0].innerHTML.match(/loadLinkForm\((\d+)\)/)[1];
					let a    = $("#link"+id);
					new Link({
						id,
						url:   a.href,
						name:  a.textContent,
						type:  type,
						for:   this
					});
				}
			}
			
			this.log("Done: Links");
			return Promise.all(promises);
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
