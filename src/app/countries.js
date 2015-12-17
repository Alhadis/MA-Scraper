"use strict";

import Feedback  from "./feedback.js";
import Scraper   from "./scraper.js";


/**
 * Helper class for holding country names keyed to their ISO 3166-1 alpha-2 codes.
 *
 * Because this list is populated the first time a resource's details are parsed,
 * we needn't worry about maintaining such a list ourselves.
 */
class Countries{
	
	static loaded = false;
	
	
	/**
	 * Populate the class's country code/name mappings.
	 *
	 * This method is idempotent: repeated calls have no effect.
	 * 
	 * @param {Object} list - A hash of country names keyed to their 2-letter codes
	 * @return {Boolean}
	 */
	static set(list){
		if(this.loaded) return false;
		
		/** We were given an HTMLSelectElement as input; parse it ourselves */
		if("options" in list)
			list = this.parseHTML(list);
		
		for(let i in list){
			let code = i;
			let name = list[i];
			
			this[code] = name;
			this[name] = code;
		}
		
		console.warn("Country codes populated");
		return (this.loaded = true);
	}
	
	
	/**
	 * Helper method for parsing the contents of an HTMLSelectElement into a hash.
	 *
	 * @param {HTMLSelectElement} input - A <select> element to parse
	 * @return {Object}
	 */
	static parseHTML(input){
		let results   = {};
		for(let i of Array.from(input.options))
			if(i.value) results[i.value] = i.textContent.trim();
		return results;
	}
	
	
	/**
	 * Load a list of countries from a newly-loaded page.
	 *
	 * This method should only be called as a last resort, such as if no resources
	 * that've been loaded have been able to supply a call to Countries.set().
	 *
	 * @return {Promise}
	 */
	static load(){
		console.warn("Loading countries from submission form");
		let url = "http://www.metal-archives.com/band/add";
		
		return Scraper.getHTML(url).then(window => {
			console.warn("Received country data");
			let results = this.parseHTML(window.document.querySelector("#country"));
			this.set(results);
		});
	}
}


export default Countries;
