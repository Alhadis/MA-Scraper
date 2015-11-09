"use strict";

import Scraper     from "./scraper.js";
import Submission  from "./submission.js";


class Label extends Submission{
	
	objectTypeID = 2;
	
	
	/**
	 * Load the label's data from Metal Archives.
	 *
	 * @return {Promise}
	 */
	load(){
		return super.load([
			this.loadCore,
			this.loadPeripherals
		]);
	}
	
	

	/**
	 * Loads the majority of the band's details.
	 *
	 * @return {Promise}
	 */
	loadCore(){
		this.log("Loading: Main data");
		let url = `http://www.metal-archives.com/label/edit/id/${this.id}`;
		
		return Scraper.getHTML(url).then(window => {
			this.log("Received: Main data");
			let promises    = [];
			
			let document    = window.document;
			let $           = s => document.querySelector(s);
			let optionText  = s => {
				let el = $(s);
				return el.options[el.selectedIndex].textContent;
			};


			/** Extract basic info */
			this.name            = $("#labelName").value;
			this.status          = optionText("#status");
			this.country         = $("#country").value;
			this.aka             = $("#altSpelling").value;
			this.specialty       = $("#specialisation").value;
			this.description     = $('textarea[name="description"]').value;
			this.url             = $("#website").value;
			this.onlineShopping  = $("#onlineShopping_1").checked;
			this.founded         = this.parseDate(window, "#foundingDateDay", "#foundingDateMonth", "#foundingDateYear");
			this.logo            = ($("#label_logo") || {}).href;
			this.address         = $('textarea[name="address"]').value;
			this.phone           = $("#phone").value;
			this.email           = $("#email").value;
			this.notes           = $('textarea[name="additionalNotes"]').value;
			this.warning         = $('textarea[name="notesWarning"]').value;
			this.legit           = $("#verified_1").checked;


			/** Parent label */
			this.parent = parseInt($('input[name="parentLabelId"]').value);
			if(this.parent){
				this.log("Creating parent label");
				this.parent = new Label(this.parent);
				promises.push(this.parent.load());
			}
			
			this.log("Done: Main data");
			return Promise.all(promises);
		});
	}



	loadPeripherals(){
		this.log("Loading: Peripherals");
		let url = `http://www.metal-archives.com/label/view/id/${this.id}`;
		
		return Scraper.getHTML(url).then(window => {
			this.log("Received: Peripherals");
			let promises = [];
			
			/** Load dates that the resource was last modified/created */
			promises.push(...(this.parseAuditTrail(window)));
			
			this.log("Done: Peripherals");
			return Promise.all(promises);
		})
	}
}

export default Label;
