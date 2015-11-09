"use strict";

import DataList from "./data-list.js";


const typeNames = {
	1: "band",
	2: "label",
	3: "person",
	4: "release"
};


/**
 * Modification history for a band, artist, label or release.
 */
class History extends DataList{
	
	constructor(forObject){
		let id    = forObject.id;
		let type  = typeNames[forObject.objectTypeID];
		let url   = `http://www.metal-archives.com/history/ajax-view/id/${id}/type/${type}/mode/page/filter/all`;
		super(url);
	}
	

	/**
	 * Return the query variables to append to the next request's URL.
	 *
	 * @return {Object}
	 */
	getArgs(){
		return {
			sEcho:          1,
			iColumns:       5,
			sColumns:       "",
			iDisplayStart:  this.start,
			iDisplayLength: this.length,
			mDataProp_0:    0,
			mDataProp_1:    1,
			mDataProp_2:    2,
			mDataProp_3:    3,
			mDataProp_4:    4,
			iSortCol_0:     0,
			sSortDir_0:     this.order,
			iSortingCols:   1,
			bSortable_0:    true,
			bSortable_1:    true,
			bSortable_2:    false,
			bSortable_3:    false,
			bSortable_4:    true,
			_:              Date.now()
		};
	}
}

export default History;
