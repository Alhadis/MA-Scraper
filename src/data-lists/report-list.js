"use strict";

import DataList from "./data-list.js";


class ReportList extends DataList{

	constructor(forObject){
		let id   = forObject.id;
		let type = forObject.objectTypeID;
		super(`http://www.metal-archives.com/report/ajax-by-object/type/${type}/id/${id}/mode/page/json/1`);
		this.order = "asc";
	}


	/**
	 * Return the query arguments to fetch the next page of reports.
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
			iSortCol_0:     4,
			sSortDir_0:     this.order,
			iSortingCols:   1,
			bSortable_0:    false,
			bSortable_1:    true,
			bSortable_2:    true,
			bSortable_3:    true,
			bSortable_4:    true,
			_:              Date.now()
		};
	}
}

export default ReportList;
