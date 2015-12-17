"use strict";

import Scraper  from "../app/scraper.js";
import Resource from "./resource.js";
import User     from "./user.js";


class Edit extends Resource{
	
	/**
	 * Represents a single item in a Submission's modification history.
	 *
	 * @param {Array} data - Row of data pulled from returned JSON array
	 * @constructor
	 */
	constructor(data){
		let id = +data[3].match(/data-historyId='(\d+)'/i)[1];
		super(id);
		
		this.id      = id;
		this.on      = this.on      || data[0];
		this.by      = this.by      || new User(data[1].match(/>([^<]+)<\/a>/i)[1]);
		this.note    = this.note    || data[2];
		this.details = this.details || [];
		this.for     = this.for     || new Set();
		
		/** Store whether or not this modification has additional details to load */
		this.haveDetails = /ui-icon-plus/.test(data[3]);
	}
	
	
	
	/**
	 * Load any additional metadata.
	 *
	 * @return {Promise}
	 */
	load(){
		
		/** Bail early if we know there's nothing else to load. */
		if(!this.haveDetails || this.loaded) return Promise.resolve();
		
		delete this.haveDetails;
		this.log("Loading: Details");
		this.loaded = true;
		let url     = `http://www.metal-archives.com/history/ajax-details/id/${this.id}`;
		
		return Scraper.getHTML(url).then(window => {
			this.log("Received: Details");
			
			let rows = window.document.querySelectorAll("tbody > tr");			
			for(let r of rows){
				this.details.push({
					field: r.cells[0].textContent,
					old:   r.cells[1].textContent,
					new:   r.cells[2].textContent
				});
			}
		});
	}
	
	
	
	/**
	 * Return a JSON-optimised representation of the modification's data.
	 *
	 * @param {String} property
	 * @return {Object}
	 */
	toJSON(property){
		if(property) return super.toJSON(property);
		
		let result       = {};
		let haveDetails  = this.details && this.details.length;
		if(this.on)      result.on       = this.on;
		if(this.by)      result.by       = this.by;
		if(this.ip)      result.ip       = this.ip;
		if(this.note)    result.note     = this.note;
		if(haveDetails)  result.details  = this.details;
		
		/** Sort "for" array by each subject's object type */
		if(this.for) result.for = [...this.for].sort((a, b) => {
			let A = a.objectTypeID;
			let B = b.objectTypeID;
			if(A < B) return -1;
			if(A > B) return 1;
			return 0;
		});

		return result;
	}
}


export default Edit;
