"use strict";

import Scraper     from "./scraper.js";
import Submission  from "./submission.js";
import Band        from "./band.js";
import Label       from "./label.js";
import Member      from "./member.js";
import Track       from "./track.js";


class Release extends Submission{
	
	load(){
		return super.load([
			this.loadCore,
			this.loadPeripherals,
			this.loadMembers
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
				let el = "string" === typeof s ? $(s) : s;
				return el.options[el.selectedIndex].textContent;
			};


			/** Release type */
			let releaseTypes   = $("#typeId");
			let releaseType    = releaseTypes.options[releaseTypes.selectedIndex];
			let multipleBands  = +releaseType.getAttribute("data-multiple-bands");
			let bandsPerTrack  = +releaseType.getAttribute("data-band-per-track");

			/** Begin ripping out vitals */
			this.name          = $("#releaseName").value;
			this.type          = releaseType.textContent;
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
			
			/** Components */
			this.components    = [];
			let fieldsets      = document.querySelectorAll("#tracklist > tbody");
			for(let i of fieldsets){
				let component = {
					title: (i.querySelector(".componentTitle") || {}).value
				};
				
				/** Physical format */
				let format       = i.querySelector("select[name^=formats]");
				let activeFormat = format.options[format.selectedIndex];
				let hasSides     = +activeFormat.getAttribute("data-sides");
				let hasRPM       = +activeFormat.getAttribute("data-rpm");
				let hasSizes     = +activeFormat.getAttribute("data-sizes");
				component.format = +format.value ? optionText(format) : "";
				
				/** Properties of physical formats */
				if(hasRPM)    component.rpm   = (i.querySelector("select[name^=rpm]")  || {}).value;
				if(hasSizes)  component.size  = (i.querySelector("select[name^=size]") || {}).value;
				if(hasSides){
					let titles            = Array.from(i.querySelectorAll("input[name^=sideTitle]"));
					component.titles      = titles.map(e => e.value);
					component.doubleSided = !!(i.querySelector("input[name^=chkSameSongs]") || {}).checked;
					component.singleSided = !!(i.querySelector("input[name^=chkOnlySideA]") || {}).checked;
					
					/** Don't bother storing a titles array if they're all blank */
					if(component.titles.every(e => e === ""))
						delete component.titles;
				}
				
				let discNumber   = this.components.push(component);


				/** Side markers */
				let sideIndices  = [];
				if(hasSides){
					Array.from(i.querySelectorAll(".sideHeader")).forEach((s, index) => {
						let sideLetter = (s.textContent.match(/^\s*Side\s+(\w+)/i) || {})[1] || "ABCDEFGH"[index];
						sideIndices[s.sectionRowIndex] = sideLetter;
					});
				}
				
				/** Tracklist */
				let tracks       = i.querySelectorAll(".track");
				for(let t of tracks){
					let id       = t.id.match(/\d+$/)[0];
					let band     = t.querySelector(".trackSplitBands");
					new Track(id).load({
						name:         t.querySelector(".trackTitleField").value,
						length:       t.querySelector("#length_"         + id).value,
						lyrics:       i.querySelector("#lyricsBox_"      + id).value,
						instrumental: t.querySelector("#isInstrumental_" + id).checked,
						bonus:        t.querySelector("#isBonus_"        + id).checked,
						release:      this.id,
						index:        +t.querySelector(".trackNumberField").value,
						disc:         discNumber,
						band:         bandsPerTrack ? band.value.replace(/^@/, "") : null,
						side:         !hasSides ? null : sideIndices.slice(0, t.sectionRowIndex).filter(o => o).pop()
					});
				}
			}
			
			
			this.log("Done: Main data");
			return Promise.all(promises);
		});
	}
	
		
	
	/**
	 * Load auxiliary release data not accessible from the edit page (e.g., timestamps)
	 *
	 * @return {Promise}
	 */
	loadPeripherals(){
		this.log("Loading: Peripherals");
		let url = `http://www.metal-archives.com/release/view/id/${this.id}`;
		
		return Scraper.getHTML(url).then(window => {
			this.log("Received: Peripherals");
			let promises    = [];
			
			/** Load the release's timestamps */
			promises.push(...(this.parseAuditTrail(window)));
			
			return Promise.all(promises);
		});
	}
	
	
	
	/**
	 * Load the artists who recorded on or contributed to the release.
	 *
	 * @return {Promise}
	 */
	loadMembers(){
		return Promise.all([
			this::Member.loadLineup(Member.TYPE_MAIN),
			this::Member.loadLineup(Member.TYPE_GUEST),
			this::Member.loadLineup(Member.TYPE_MISC)
		]);
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
