"use strict";

import Artist   from "./artist.js";
import Resource from "./resource.js";
import Role     from "./role.js";


/**
 * Describes an artist's involvement in a band or release's recording.
 *
 * Unlike other resources, Members aren't loaded from a remote source:
 * they're extracted from chunks of HTML in the "Edit Line-up" page.
 */
class Member extends Resource{
	
	/**
	 * Extract relevant data from a sequence of HTML nodes.
	 *
	 * @param {Array} chunks - Array of HTML elements
	 * @return {Promise}
	 */
	load(chunks){
		this.roles = this.roles || [];
		return this.getMemberInfo(...chunks);
	}
	
	
	
	/**
	 * Extract relevant member data from the supplied HTML nodes.
	 *
	 * @param {HTMLElement} artist - Chunk containing artist-specific data
	 * @param {HTMLElement} roles  - Chunk containing their roles in the line-up
	 * @return {Promise}
	 */
	getMemberInfo(artist, roles){
		let $        = s => artist.querySelector(s);
		
		/** Parse the main member-related data */
		this.artist  = new Artist(artist.innerHTML.match(/<a href="http:\/{2}www\.metal-archives\.com\/artist\/edit\/id\/(\d+)"/i)[1]);
		this.alias   = $("input[name^='alias']").value;
		this.type    = $("select[name^='type']").value;
		this.active  = $("input[type='checkbox'][id^='status_']").checked;
		
		
		/** Now start collecting the roles */
		let roleRows = roles.querySelectorAll("tr[id^='role_']");
		for(let row of roleRows)
			this.roles.push(new Role(row));


		/** Load the artist and return the resulting Promise */
		return this.artist.load();
	}
}

/** Member type constants */
Member.TYPE_MAIN     = 1;
Member.TYPE_GUEST    = 2;
Member.TYPE_LIVE     = 3;
Member.TYPE_MISC     = 4;

export default Member;
