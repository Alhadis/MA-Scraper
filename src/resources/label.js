"use strict";

import Scraper     from "../app/scraper.js";
import Submission  from "./submission.js";
import File        from "./file.js";


class Label extends Submission{
	
	objectTypeID   = 2;
	objectTypeName = "label";
	
	
	/**
	 * Load the label's data from Metal Archives.
	 *
	 * @return {Promise}
	 */
	load(){
		return super.load([
			this.loadCore,
			this.loadPeripherals,
			this.loadReports,
			this.loadHistory,
			this.loadLinks
		]);
	}
	
	

	/**
	 * Load the majority of the label's details.
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
			this.country         = this.parseCountry($("#country"));
			this.aka             = $("#altSpelling").value;
			this.specialty       = $("#specialisation").value;
			this.description     = $('textarea[name="description"]').value;
			this.url             = $("#website").value;
			this.onlineShopping  = $("#onlineShopping_1").checked;
			this.founded         = this.parseDate(window, "#foundingDateDay", "#foundingDateMonth", "#foundingDateYear");
			this.logo            = new File(($("#label_logo") || {}).href);
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
			
			/** Get the label's creation/modification details */
			promises.push(this.parseAuditTrail(window));
			
			this.log("Done: Peripherals");
			return Promise.all(promises);
		})
	}
	
	
	
	/**
	 * Return a JSON-friendly representation of the label's data.
	 *
	 * @param {String} property
	 * @return {Object}
	 */
	toJSON(property){
		if(property) return super.toJSON(property);
		
		let result = {};
		if(this.name)            result.name           = this.name;
		if(this.status)          result.status         = this.status;
		if(this.country)         result.country        = this.country;
		if(this.aka)             result.aka            = this.aka;
		if(this.parent)          result.parent         = this.parent;
		if(this.specialty)       result.specialty      = this.specialty;
		if(this.description)     result.description    = this.description;
		if(this.url)             result.url            = this.url;
		if(this.onlineShopping)  result.onlineShopping = true;
		if(this.founded)         result.founded        = this.founded;
		if(this.logo)            result.logo           = this.logo;
		if(this.address)         result.address        = this.address;
		if(this.phone)           result.phone          = this.phone;
		if(this.email)           result.email          = this.email;
		if(this.notes)           result.notes          = this.notes;
		if(this.warning)         result.warning        = this.warning;
		if(this.legit)           result.legit          = true;
		
		/** Delete bogus dates */
		let bogusDate = "0000-00-00";
		if(bogusDate === result.founded) delete result.founded;
		
		return Object.assign(result, super.toJSON());
	}
}

export default Label;
