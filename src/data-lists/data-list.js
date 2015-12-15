"use strict";

import Feedback from "../app/feedback.js";
import Scraper  from "../app/scraper.js";


class DataList{
	
	/**
	 * Create a new DataList object for collecting pages of results.
	 *
	 * @param {String} url - URL to load, sans trailing query string
	 * @constructor
	 */
	constructor(url){
		this.url = url;
		
		/** Query parameters */
		this.start  = 0;
		this.length = 500;
		this.order  = "desc";
		
		/** Collected data */
		this.totalResults = null;
		this.data         = [];
	}
	
	
	
	/**
	 * Load the next page of results.
	 *
	 * @return {Promise}
	 */
	load(){
		let args = "?" + queryString.stringify(this.getArgs());
		
		return Scraper.get(this.url + args).then(result => {
			this.start += this.length;
			let data = result.replace(/(\n\t"sEcho": ),/, "$10,")
			
			try{
				data = JSON.parse(data);
			} catch(e){
				let text = "JSON parsing error:\n";
				text += "  - URL:      " + this.url + args + "\n";
				text += "  - Raw data: " + result;
				Feedback.error(text);
				throw new SyntaxError(e);
			}
			
			/** Store the total number of results */
			if(null === this.totalResults)
				this.totalResults = +data.iTotalRecords;
			
			this.data.push(...(data.aaData));
			
			/** Still some results left to load */
			if(this.data.length < this.totalResults)
				return this.load();
			
			else return this;
		});
	}
	
	
	
	/**
	 * Return the query variables to append to the next request's URL.
	 *
	 * Intended to be overridden by a subclass.
	 *
	 * @return {Object}
	 */
	getArgs(){
		return {
			sEcho:          1,
			iDisplayStart:  this.start,
			iDisplayLength: this.length,
			_:              Date.now()
		};
	}
}

export default DataList;
