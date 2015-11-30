"use strict";

import Scraper  from "../app/scraper.js";
import Resource from "./resource.js";
import User     from "./user.js";


const STATUS_UNASSIGNED   = 1;
const STATUS_ASSIGNED     = 2;
const STATUS_RESOLVED     = 3;
const STATUS_CLOSED       = 4;
const statusLabels        = {
	[STATUS_UNASSIGNED]: "Unassigned",
	[STATUS_ASSIGNED]:   "Assigned",
	[STATUS_RESOLVED]:   "Resolved",
	[STATUS_CLOSED]:     "Closed"
};


class Report extends Resource{
	
	/**
	 * Return a STATUS_* constant from its named counterpart.
	 *
	 * @param {String} input - Report status's name, checked case-insensitively
	 * @return {Number}
	 */
	static statusByName(input){
		let name = input.toUpperCase();
		for(let i in statusLabels)
			if(name === statusLabels[i].toUpperCase()) return i;
		return null;
	}
	

	/**
	 * Populate a Report instance's data properties.
	 *
	 * @return {Promise}
	 */
	load(){
		return super.load([
			this.loadCore
		]);
	}
	
	
	/**
	 * Load the majority of the Report's data, including user comments.
	 *
	 * @return {Promise}
	 */
	loadCore(){
		this.log("Loading: Main data");
		let url = `http://www.metal-archives.com/report/view/id/${this.id}`;
		
		return Scraper.getHTML(url).then(window => {
			this.log("Received: Main data");
			let promises    = [];
			
			let document    = window.document;
			let $           = s => document.querySelector(s);
			let optionText  = s => {
				let el = "string" === typeof s ? $(s) : s;
				return el.options[el.selectedIndex].textContent;
			};
			
			
			
			/** Ascertain report's category, if it's not already been set */
			if(undefined === this.type){
				this.log("Category not set, scraping from page");
				this.type = optionText("#report_category_id");
			}


			/** Status */
			let status = $("#report_status_id");
			if(undefined === this.status){
				this.log("Status not set, scraping from page");
				this.status = +status.value;

				/** A user's taken the assignment for the report */
				if(STATUS_ASSIGNED === this.status && undefined === this.assignee){
					this.log("Scraping assignee from page");
					
					/** Wasn't ME, was it? */
					if(status.querySelector("option[value='-2']")){
						
						/** Nope, wasn't me. Find out who. */
						let assignedText = status.options[this.status].textContent;
						this.log(`Creating User from report status: "${assignedText}"`);
						this.assignee    = new User(assignedText.replace(/^\s*Assigned to\s+|\s*$/g, ""));
					}
					
					/** Oh, it WAS me. Whoops. */
					else this.assignee   = new User($(".member_name").textContent.trim());
				}				
			}
			
			
			/** Discussion thread */
			this.comments    = {};
			let comments     = document.querySelectorAll(".commentBox");
			for(let i of comments){
				let id       = i.id.match(/_(\d+)$/)[1];
				let text     = $("#commentText_" + id).textContent.replace(/^\n?\t{5}|\n\t{9,}$/g, "");
				
				/** Source/Evidence */
				let marker   = i.querySelector(".commentContent > strong");
				let evidence = null;
				if(marker){
					evidence = "";
					marker   = marker.nextSibling;
					
					while(marker){
						evidence += marker.textContent;
						marker = marker.nextSibling;
					}
					
					/** Carefully snip trailing/leading whitespace from the compiled text */
					evidence = evidence.replace(/^\x20?\n\t{6}|\n\t{9}\n\t{3}$/g, "");
				}
			

				/** Comment written by user or visitor? */
				let by       = null;
				let userLink = i.querySelector(".profileMenu");
				if(userLink){
					by = new User(userLink.textContent.trim());
					
					/** User's details haven't been fully loaded */
					if(!by.name){
						let actions  = i.querySelector(".commentButtons");
						let userID   = +(actions.innerHTML.match(/javascript:\s*givePoint\(\w+,\s*(\d+),/) || {})[1];
						
						/** User hasn't loaded their real/internal ID yet, and it's available from the page's source */
						if(userID){
							by.name  = by.id;
							by.id    = userID;
						}
					}
				}
				
				let on      = i.querySelector(".comment-datetime").getAttribute("data-datetime");
				let ip      = i.querySelector("a[href*='metal-archives.com/tools/ip-cross-ref']").textContent.trim();
				let comment = { text, evidence, by, on, ip };
				if(null === comment.evidence)
					delete comment.evidence;
				
				this.comments[id] = comment;
			}
			
			this.log("Done: Main data");
			return Promise.all(promises);
		});
	}
	
	
	
	/**
	 * Return a JSON-friendly representation of the Report's data.
	 *
	 * @param {String} property
	 * @return {Object}
	 */
	toJSON(property){
		if(property) return super.toJSON(property);
		
		let result = {};
		if(this.for)          result.for       = this.for;
		if(this.type)         result.type      = this.type;
		if(this.status)       result.status    = this.status;
		if(this.assignee)     result.assignee  = this.assignee;
		if(this.modNeeded)    result.modNeeded = true;
		if(this.added)        result.added     = this.added;
		if(this.comments)     result.comments  = this.comments;
		return result;
	}
}

export default Report;
