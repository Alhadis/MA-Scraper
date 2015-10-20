"use strict";

import Resource from "./resource.js";


class Role extends Resource{
	
	/**
	 * Represents a single role entry in an artist's line-up listing.
	 *
	 * @param {HTMLElement} el - Row containing the relevant data
	 * @constructor
	 */
	constructor(el){
		let id = el.id.match(/_(\d+)$/)[1];
		super(id);

		this.id     = id;
		this.name   = el.querySelector(".roleDesc").value;
		this.from   = el.querySelector("input[name^=dateFrom]").value;
		this.to     = el.querySelector("input[name^=dateTo]").value;
	}
	
}


export default Role;
