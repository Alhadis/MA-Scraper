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
		this.on      = data[0];
		this.by      = new User(data[1].match(/>([^<]+)<\/a>/i)[1]);
		this.note    = data[2];
		this.details = [];
		this.for     = new Set();
		
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
		if(!this.haveDetails) return Promise.resolve();
		
		delete this.haveDetails;
		this.log("Loading: Details");
		let url = `http://www.metal-archives.com/history/ajax-details/id/${this.id}`;
		
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
}


export default Edit;
