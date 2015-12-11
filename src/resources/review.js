"use strict";

import Resource from "./resource.js";
import Release  from "./release.js";
import User     from "./user.js";


class Review extends Resource{
	
	/**
	 * Instantiate a new Review instance.
	 *
	 * @param {HTMLElement} el - HTML node holding the entirety of the review data
	 * @param {Release} release - Album this review was written for
	 * @constructor
	 */
	constructor(el, release){
		let id = el.id.match(/_(\d+)$/)[1];
		super(id);
		
		/** Extract review's title and rating */
		let heading  = el.querySelector(".reviewTitle");
		let info     = heading.textContent.match(/^\s*(.*?)(?: - )(\d+)%\s*$/);
		this.title   = info[1];
		this.rating  = info[2];
		this.for     = this.for || release.getParent(true);
		
		
		/** Pull the author's name, date, and other publication-related junk */
		let metadata = heading.nextElementSibling;
		let username = metadata.querySelector("a.profileMenu");
		let date     = username.nextSibling.data.match(/^\s*,\s*(.*?)(?:\s*~)?\s*$/)[1].replace(/(th|st|nd|rd),/, "");
		this.added   = {
			by:    new User(username.textContent.trim()),
			on:    new Date(date + " GMT").toISOString().replace(/[TZ]/g, " ").trim()
		};
		
		/** Store the internal ID of the user who wrote the review */
		let moveBtn  = el.querySelector(".reviewMove");
		this.added.by.setID(parseInt(moveBtn.getAttribute("data-user")));
		
		
		/** Save the submitter's IP address, if possible */
		let ipLink   = metadata.querySelector("a[href*='/tools/ip-cross-ref']");
		ipLink && (this.added.ip = ipLink.textContent);
		
		
		/** Store which release version the review was written for, if any */
		let match    = /Written based on this version:/;
		let written  = Array.from(metadata.childNodes).find(e => 3 === e.nodeType && match.test(e.data));
		if(written)
			this.version = new Release(written.nextSibling.href.match(/\d+$/)[0]);
		
		
		/** Store the name of the mod who approved the review, if available */
		let approver = el.querySelector(".approver");
		approver && (this.approver = new User(approver.textContent.match(/^\s*Approved by (.*)$/i)[1]));
		
		
		/** Now save the actual review body */
		this.body    = el.querySelector("#reviewText_" + this.id).innerHTML.replace(/<br(?:\s*\/)?>/g, "");
	}
	
	
	
	/**
	 * Load the ID of the mod who approved this review.
	 *
	 * @return {Promise}
	 */
	load(){
		return this.approver ? this.approver.load() : Promise.resolve();
	}
}


export default Review;
