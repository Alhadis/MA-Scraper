"use strict";

import Scraper     from "../app/scraper.js";
import Collectors  from "../data-lists/collectors.js";
import Submission  from "./submission.js";
import Band        from "./band.js";
import Label       from "./label.js";
import Member      from "./member.js";
import Track       from "./track.js";
import Review      from "./review.js";


class Release extends Submission{
	
	objectTypeID   = 4;
	objectTypeName = "release";
	
	
	/**
	 * Load a release's details from Metal Archives.
	 *
	 * @return {Promise}
	 */
	load(){
		return super.load([
			this.loadCore,
			this.loadPeripherals,
			this.loadMembers,
			this.loadReports,
			this.loadReviews,
			this.loadCollectors,
			this.loadHistory
		]).then(this::this.loadFinished);
	}
	
	
	
	/**
	 * Load the majority of the release's data.
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
				return !el ? undefined : el.options[el.selectedIndex].textContent;
			};
			
			
			/** Manage inheritance */
			let parentID = $("input[name='parentId']").value;
			if(parentID){
				this.parent         = new Release(parentID);
				this.overrideSongs  = parseInt($("#override_songs").value);
			}
			
			/** Release type */
			let releaseTypes   = $("#typeId");
			let releaseType    = releaseTypes.options[releaseTypes.selectedIndex];
			let multipleBands  = +releaseType.getAttribute("data-multiple-bands");
			let bandsPerTrack  = +releaseType.getAttribute("data-band-per-track");

			/** Begin ripping out vitals. Make sure to ignore inherited properties. */
			this.name          = ($("#releaseName:not(.inheritedField)") || {}).value;
			this.type          = releaseTypes.classList.contains("inheritedField") ? undefined : releaseType.textContent;
			this.date          = $("select[name^='releaseDate'].inheritedField")   ? undefined : this.parseDate(window, "#releaseDateDay", "#releaseDateMonth", "#releaseDateYear");
			this.catId         = ($("#catalogNumber:not(.inheritedField)") || {}).value;
			this.limitation    = ($("#nbCopies:not(.inheritedField)")      || {}).value;
			this.cover         = $("#cover.inheritedField") ? undefined : ($(".album_img > #cover") || {}).href;
			this.description   = ($("#versionDescription:not(.inheritedField)") || {}).value;
			this.authenticity  = optionText("#authenticityId");
			this.separate      = $("#separateListing_1").checked;
			this.locked        = $("#lockUpdates_1").checked;
			this.notes         = ($("textarea[name=notes]:not(.inheritedField)")         || {}).value;
			this.recordingInfo = ($("textarea[name=recordingInfo]:not(.inheritedField)") || {}).value;
			this.identifiers   = ($("textarea[name=identifiers]:not(.inheritedField)")   || {}).value;
			this.warning       = ($("textarea[name=notesWarning]:not(.inheritedField)")  || {}).value;
			
			/** Release's label */
			let label          = parseInt($("#labelId").value);
			let selfReleased   = $("#indieLabel_1").checked;
			if(label && !selfReleased){
				this.labels = [new Label(label)];
				promises.push(this.labels[0].load());
			}
			
			/** Bands featured on this release */
			this.for           = [];
			this.for.toString  = function(){return this.map(i => i.name || ("@"+i)).join("|")};
			let bandsList      = $(".trackSplitBands").children;
			for(let i of Array.from(bandsList)){
				
				/** Reference to an unlisted band entry */
				if(/^@/.test(i.value))
					this.for.push(i.textContent);
				
				/** Regular/listed band */
				else{
					let band   = new Band(i.value);
					band.name  = i.textContent;
					this.for.push(band);
				}
			}
			
			
			/** Components */
			this.components    = [];
			let fieldsets      = document.querySelectorAll("#tracklist > tbody");
			for(let i of fieldsets){
				let component = {};
				let compTitle = i.querySelector(".componentTitle") || {};
				if(compTitle.value)
					component.title = compTitle.value;
				
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
				this.tracks      = [];
				for(let t of i.querySelectorAll(".track")){
					let id       = t.id.match(/\d+$/)[0];
					let band     = t.querySelector(".trackSplitBands");
					
					let track    = new Track(id);
					this.tracks.push(track);
					track.load({
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
			
			
			/** Prune undefined properties, probably inherited from a parent release */
			for(let i in this)
				if(undefined === this[i]) delete this[i];
			
			/** Check for some additional properties to cull if there's a parent detected */
			if(this.parent){
				
				/** Delete identical bands lists */
				if(this.for.toString() === this.parent.for.toString())
					delete this.for;
				
				/** Hell, may as well trash identical components lists while we're here */
				if(JSON.stringify(this.parent.components) === JSON.stringify(this.components))
					delete this.components;
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
			
			/** Get the release's creation/modification details */
			this.parseAuditTrail(window);
			
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
	 * Load this release's reviews, if any.
	 *
	 * @return {Promise}
	 */
	loadReviews(){
		this.log("Loading: Reviews");
		let url = `http://www.metal-archives.com/reviews/_/_/${this.id}/`;
		
		return Scraper.getHTML(url).then(window => {
			this.log("Received: Reviews");
			let reviews  = window.document.querySelectorAll(".reviewBox");
			
			for(let i of Array.from(reviews))
				new Review(i, this);
			
			this.log("Done: Reviews");
			return Promise.resolve();
		});
	}
	
	
	
	/**
	 * Load who has this release in their collection/trade-list/wishlist.
	 *
	 * @return {Promise}
	 */
	loadCollectors(){
		this.log("Loading: Collectors");
		
		let collectors = [
			new Collectors(this, Collectors.OWNERS),
			new Collectors(this, Collectors.TRADERS),
			new Collectors(this, Collectors.WANTERS)
		];
		
		return Promise.all(collectors.map(i => i.load())).then(o => {
			this.log("Done: Collectors");
			collectors.map(i => i.applyToUsers())
		});
	}
	
	
	
	/**
	 * Called when everything else has finished loading.
	 *
	 * @return {Promise}
	 */
	loadFinished(){
		
		/** Don't bother loading reissues if this actually IS a reissue. */
		if(this.parent) return Promise.resolve();
		
		this.log("Loading: Other versions");
		let url = `http://www.metal-archives.com/release/ajax-versions/current/${this.id}/parent/${this.id}`;
		return Scraper.getHTML(url).then(window => {
			this.log("Received: Other versions");
			let promises = [];
			
			let document = window.document;
			let $$       = s => document.querySelectorAll(s);
			
			/** Create a new Release instance for every reissue found */
			for(let i of Array.from($$("table.display > tbody > tr:not(.priorityReport)"))){
				let editBtn    = i.querySelector(".ui-icon-pencil").parentNode;
				let reissue    = new Release(+editBtn.href.match(/\d+$/)[0]);
				reissue.parent = this;
				promises.push(reissue.load());
			}
			
			this.log("Done: Other versions");
			return Promise.all(promises);
		});
	}
	
	
	
	/**
	 * Return a reference to the instance's parent release.
	 *
	 * If the instance lacks a parent, a reference to itself is returned instead.
	 *
	 * @param {Boolean} topMost - Return the top-most ancestor instead of the immediate parent
	 * @return {Release}
	 */
	getParent(topMost){
		if(!this.parent) return this;
		if(!topMost)     return this.parent;
		
		let parent = this.parent;
		while(parent.parent)
			parent = parent.parent;
		return parent;
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
	
	
	
	/**
	 * Return a JSON-friendly representation of the release's data.
	 *
	 * @param {String} property
	 * @return {Object}
	 */
	toJSON(property){
		if(property) return super.toJSON(property);
		
		let result              = {};
		let haveLabels          = this.labels && this.labels.length;
		let haveBands           = this.for && this.for.length !== 0;
		
		if(this.parent)         result.parent         = this.parent.id;
		if(this.overrideSongs)  result.overrideSongs  = true;
		if(this.name)           result.name           = this.name;
		if(this.type)           result.type           = this.type;
		if(this.date)           result.date           = this.date;
		if(haveLabels)          result.labels         = this.labels;
		if(this.catId)          result.catId          = this.catId;
		if(this.limitation)     result.limitation     = this.limitation;
		if(this.cover)          result.cover          = this.cover;
		if(this.description)    result.description    = this.description;
		if(this.authenticity)   result.authenticity   = this.authenticity;
		if(this.separate)       result.separate       = this.separate;
		if(this.locked)         result.locked         = true;
		if(this.notes)          result.notes          = this.notes;
		if(this.recordingInfo)  result.recordingInfo  = this.recordingInfo;
		if(this.identifiers)    result.identifiers    = this.identifiers;
		if(this.warning)        result.warning        = this.warning;
		if(haveBands)           result.for            = this.for.length === 1 ? this.for[0] : this.for;
		if(this.components)     result.components     = this.components;
		
		return Object.assign(result, super.toJSON());
	}
}

export default Release;
