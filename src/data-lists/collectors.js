"use strict";

import DataList from "./data-list.js";
import User     from "../resources/user.js";


/**
 * Represents a list of users who've added a release to a collection list (trade list, owned list, etc).
 */
class Collectors extends DataList{
	
	static OWNERS    = 1;
	static TRADERS   = 2;
	static WANTERS   = 3;
	
	
	/**
	 * Instantiate a new list of collectors.
	 *
	 * @param {Release} release - The release in question
	 * @param {Number}  type    - An integer describing what sort of collection list is being queried.
	 * @constructor
	 */
	constructor(release, type){
		super(`http://www.metal-archives.com/collection/ajax-owners/id/${release.id}/type/${type}/json/1`);
		this.release = release;
		this.type    = type;
		this.length  = 200;
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
			_:              Date.now()
		};
	}
	
	
	
	/**
	 * Add the release to each user's collection list.
	 */
	applyToUsers(){
		let listName   = [, "collection", "trade", "wish"][this.type];
		let releaseID  = this.release.id;
		
		for(let i of this.data){
			let [groupID, username, version, notes] = i;
			let user = new User(username.match(/>([^<]+)<\/a>\s*$/i)[1]);
			let list = user.lists[listName];
			
			/** User owns this particular version */
			if(+groupID === 0){
				if(!list.some(i => i.version == releaseID))
					list.push({
						id:       this.release.getParent().id,
						version:  releaseID,
						notes:    notes
					});
			}
			
			/** User never specified the release's version */
			else if("Unspecified" === version && !this.release.parent){
				if(!list.some(i => i.id == releaseID))
					list.push({
						id:    releaseID,
						notes: notes
					});
			}
		}
	}
}


export default Collectors;
