"use strict";

import History    from "../data-lists/history.js";
import ReportList from "../data-lists/report-list.js";
import Resource   from "./resource.js";
import Report     from "./report.js";
import User       from "./user.js";
import Edit       from "./edit.js";


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
	
	
	
	/**
	 * Load the submission's report history.
	 *
	 * @return {Promise}
	 */
	loadReports(){
		
		/** Skip this if we already know the submission has no report history */
		if(false === this.haveReports){
			this.log("Skipping: Reports");
			return Promise.resolve();
		}
		
		this.log("Loading: Reports");
		let list = new ReportList(this);
		
		return list.load().then(result => {
			this.log("Finished: Reports");
			let promises      = [];
			
			for(let i of result.data){
				let report    = new Report(+i[0].match(/href='[^']*?(\d+)'/i)[1]);
				report.type   = i[1];
				report.status = Report.statusByName(i[2]);
				
				/** Create a new User for the report's submitter, if it weren't a visitor */
				let submitter = (i[3].match(/>([^<]+)<\/a>/i) || [])[1];
				if(submitter)
					report.by = new User(submitter);
				
				promises.push(report.load());
			}
			
			return Promise.all(promises);
		});
	}
	
	
	
	/**
	 * Load the instance's modification history.
	 *
	 * @return {Promise}
	 */
	loadHistory(){
		this.log("Loading: History");
		
		return new History(this).load().then(result => {
			this.log("Finished: History");
			let promises = [];
			
			for(let i of result.data){
				let edit = new Edit(i);
				edit.for.add(this);
				promises.push(edit.load());
			}
			
			return Promise.all(promises);
		});
	}
}


export default Submission;
