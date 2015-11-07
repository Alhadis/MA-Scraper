"use strict";

import Scraper     from "./scraper.js";
import Submission  from "./submission.js";
import Band        from "./band.js";


class Release extends Submission{
	
	load(){
		return super.load([
			this.loadCore,
			this.loadPeripherals
		]);
	}
	
	
	
	/**
	 * Loads the majority of the release's data.
	 *
	 * @return {Promise}
	 */
	loadCore(){
		this.log("Loading: Main data");
		let url = `http://www.metal-archives.com/release/edit/id/${this.id}`;
		
		return Scraper.getHTML(url).then(window => {
			this.log("Received: Main data");
			
			let document = window.document;
			let $        = s => document.querySelector(s);
		});
	}
	
	
	
	/**
	 * Return a list of bands whose names are listed in a release's title element.
	 *
	 * Unlisted entries are included as strings.
	 *
	 * @param {HTMLElement} el - Node containing each band's name
	 * @return {Array}
	 */
	static bandsInTitle(el){
		let window  = el.ownerDocument.defaultView;
		
		let bands   = [];
		Array.from(el.childNodes).forEach(e => {
			
			/** Unlisted entries */
			if(e.nodeType === window.Node.TEXT_NODE){
				bands.push(...(e.data.split(/(?:\n|^)\t+\//g)
					.map(e => e.trim())
					.filter(e => !!e)));
			}
			
			/** Link to a listed band */
			else if("A" === e.tagName){
				let name = e.textContent.trim();
				let id   = e.href.match(/(\d+)$/)[1];
				let band = Band.get(id);
				
				if(!band){
					band = new Band(id);
					band.name = name;
				}

				bands.push(band);
			}
		});
		
		return bands.length === 1 ? bands[0] : bands;
	}
}

export default Release;
