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

		this.id      = id;
		this.name    = el.querySelector(".roleDesc").value;
		let dateFrom = el.querySelector("input[name^=dateFrom]");
		let dateTo   = el.querySelector("input[name^=dateTo]");
		if(dateFrom){
			this.from   = dateFrom.value;
			this.to     = dateTo.value;
		}
	}
	
	
	/**
	 * Return a JSON-friendly representation of the role's properties.
	 *
	 * This method exists chiefly to override the superclass's method, which would otherwise alias
	 * the Role if it were keyed to another property. Unlike other Resource subclasses, Roles are
	 * only referenced through the property of another class; that is, there's no need for them to
	 * be abstracted in the sense that other resources are.
	 *
	 * @param {String} property
	 * @return {Object}
	 */
	toJSON(property){
		let result = {name: this.name};
		if(this.from) result.from = +this.from;
		if(this.to)   result.to   = +this.to;
		return result;
	}
}


export default Role;
