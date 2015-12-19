"use strict";

import DataList from "./data-list.js";


/**
 * Helper class to export the site's blacklisted bands.
 *
 * Not intended for conventional use, and not used in regular exports.
 */
class Blacklist extends DataList{
	
	/**
	 * Initialise a new blacklist export.
	 *
	 * @constructor
	 */
	constructor(){
		super("http://www.metal-archives.com/blacklist/ajax-list");
		this.length     = 200;
	}
	
	
	/**
	 * Return the query variables to load the next page of results.
	 *
	 * @return {Object}
	 */
	getArgs(){
		return {
			sEcho:          1,
			iColumns:       4,
			sColumns:       "",
			iDisplayStart:  this.start,
			iDisplayLength: this.length,
			mDataProp_0:    0,
			mDataProp_1:    1,
			mDataProp_2:    2,
			mDataProp_3:    3,
			sSearch:        "",
			bRegex:         false,
			sSearch_0:      "",
			bRegex_0:       false,
			bSearchable_0:  true,
			sSearch_1:      "",
			bRegex_1:       false,
			bSearchable_1:  true,
			sSearch_2:      "",
			bRegex_2:       false,
			bSearchable_2:  true,
			sSearch_3:      "",
			bRegex_3:       false,
			bSearchable_3:  true,
			iSortCol_0:     0,
			sSortDir_0:     "asc",
			iSortingCols:   1,
			bSortable_0:    true,
			bSortable_1:    true,
			bSortable_2:    false,
			bSortable_3:    false,
			_:              Date.now()
		}
	}
}


export default Blacklist;
