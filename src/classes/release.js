"use strict";

import Scraper     from "./scraper.js";
import Submission  from "./submission.js";
import Band        from "./band.js";
import Label       from "./label.js";


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
			let promises    = [];
			
			let document    = window.document;
			let $           = s => document.querySelector(s);
			let optionText  = s => {
				let el = $(s);
				return el.options[el.selectedIndex].textContent;
			};

			/** Begin ripping out vitals */
			this.name          = $("#releaseName").value;
			this.type          = optionText("#typeId");
			this.date          = this.parseDate(window, "#releaseDateDay", "#releaseDateMonth", "#releaseDateYear");
			this.catId         = $("#catalogNumber").value;
			this.limitation    = $("#nbCopies").value;
			this.cover         = ($(".album_img > #cover") || {}).href;
			this.description   = $("#versionDescription").value;
			this.separate      = $("#separateListing_1").checked;
			this.locked        = $("#lockUpdates_1").checked;
			this.notes         = $("textarea[name=notes]").value;
			this.recordingInfo = $("textarea[name=recordingInfo]").value;
			this.identifiers   = $("textarea[name=identifiers]").value;
			this.warning       = $("textarea[name=notesWarning]").value;
			
			/** Release's label */
			let label          = parseInt($("#labelId").value);
			let selfReleased   = $("#indieLabel_1").checked;
			if(label && !selfReleased){
				this.labels = [new Label(label)];
				promises.push(this.labels[0].load());
			}
			
			this.log("Done: Main data");
			return Promise.all(promises);
		});
	}
	
	
	
	/**
	 * Load auxiliary band data not accessible from the edit page (e.g., timestamps)
	 *
	 * @return {Promise}
	 */
	loadPeripherals(){
		this.log("Loading: Peripherals");
		let url = `http://www.metal-archives.com/release/view/id/${this.id}`;
		
		return Scraper.getHTML(url).then(window => {
			this.log("Received: Peripherals");
			let promises    = [];
			
			return Promise.all(promises);
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
