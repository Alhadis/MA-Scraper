"use strict";

import Resource  from "./resource.js";
import User      from "./user.js";


/**
 * Data entered by a user.
 *
 * Examples include bands, labels, releases and artist pages.
 */
class Submission extends Resource{
	
	objectTypeID = 0;
	
	
	/**
	 * Pull creation/modification times from the page's footer.
	 *
	 * @param {Window} window
	 * @return {Array} A potentially-empty array of Promises
	 */
	parseAuditTrail(window){
		let output      = [];
		let trail       = window.document.getElementById("auditTrail");
		let rows        = trail.querySelectorAll("tr");

		let userLink    = "a.profileMenu";
		let rTimeStamp  = /(^((?:Last\s*)?Modified|Added)\s+on:\s*|N\/A\s*$)/gi;
		let by, on, info;


		/** "Added by" / "Added on" */
		by = (rows[0].children[0].querySelector(userLink) || {}).textContent;
		on = rows[1].children[0].textContent.replace(rTimeStamp, "");
		if(by || on){
			info = {};
			if(by){
				by = new User(by);
				output.push(by.load());
				info.by = by;
			}
			
			if(on) info.on = on;
			this.added     = info;
		}


		/** "Modified by" / "Last modified on" */
		by = (rows[0].children[1].querySelector(userLink) || {}).textContent;
		on = rows[1].children[1].textContent.replace(rTimeStamp, "");
		if(by || on){
			info = {};
			if(by){
				by = new User(by);
				output.push(by.load());
				info.by  = by;
			}

			if(on) info.on  = on;
			this.modified   = info;
		}
		

		/** Check if there're any reports */
		this.haveReports = !!trail.querySelector('a[href*="/report/by-object/"]');

		return output;
	}
	
	
	
	
	/**
	 * Returns an ISO-safe date from three different page elements.
	 *
	 * DOM/CSS selectors may be passed in instead of element references
	 *
	 * @param {Window} window
	 * @param {String|HTMLElement} day
	 * @param {String|HTMLElement} month
	 * @param {String|HTMLElement} year
	 * @return {String}
	 */
	parseDate(window, day, month, year){
		let $  = s => window.document.querySelector(s);
		
		let d  = "string" === typeof day   ? $(day)   : day;
		let m  = "string" === typeof month ? $(month) : month;
		let y  = "string" === typeof year  ? $(year)  : year;

		/** Add leading zeros when necessary */
		let padZeroes = (n,z) => {
			let s = n.toString();
			if(s.length < z) s = "0".repeat(z - s.length) + s;
			return s;
		};

		/** Return the compiled date components as YYYY-MM-DD */
		return [
			padZeroes(y.value || 0, 4),
			padZeroes(m.value || 0, 2),
			padZeroes(d.value || 0, 2)
		].join("-");
	}
}


export default Submission;
