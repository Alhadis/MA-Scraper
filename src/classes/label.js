"use strict";

import Scraper     from "./scraper.js";
import Submission  from "./submission.js";


class Label extends Submission{
	
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
			this.founded         = this.parseDate(window, "#foundingDateYear", "#foundingDateMonth", "#foundingDateDay");
			this.logo            = ($("#label_logo") || {}).href;
			this.address         = $('textarea[name="address"]').value;
			this.phone           = $("#phone").value;
			this.email           = $("#email").value;
			this.notes           = $('textarea[name="additionalNotes"]').value;
			this.warning         = $('textarea[name="notesWarning"]').value;
			this.legit           = $("#verified_1").checked;


			/** Parent label */
			this.parent = $('input[name="parentLabelId"]').value;
			if(this.parent){
				this.log("Creating parent label");
				this.parent = new Label(this.parent);
				promises.push(this.parent.load());
			}
		});
	}



	loadPeripherals(){
		this.log("Loading: Peripherals");
		let url = `http://www.metal-archives.com/label/view/id/${this.id}`;
		
		return Scraper.getHTML(url).then(window => {
			this.log("Received: Peripherals");
			
			/** Load dates that the resource was last modified/created */
			let promises = this.parseAuditTrail(window);
			
			/** Load the data of any users mentioned in the page's footer */
			if(promises.length)
				return Promise.all(promises);
		})
	}
}

export default Label;
