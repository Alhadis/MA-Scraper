"use strict";

import Scraper  from "./scraper.js";
import Artist   from "./artist.js";
import Band     from "./band.js";
import Release  from "./release.js";
import Resource from "./resource.js";
import Role     from "./role.js";


/**
 * Describes an artist's involvement in a band or release's recording.
 *
 * Unlike other resources, Members aren't usually loaded from a remote source:
 * they're extracted from chunks of HTML in the "Edit Line-up" page.
 */
class Member extends Resource{
	
	/**
	 * Create a new member instance.
	 *
	 * @param {Number}   id      - Numeric ID
	 * @param {Resource} parent  - Subject object that the member's attached to
	 * @constructor
	 */
	constructor(id, parent){
		super(id);
		this.for = parent;
	}
	
	
	
	/**
	 * Extract relevant data from a sequence of HTML nodes.
	 *
	 * If passed no arguments, the data is extracted from a standalone form instead.
	 *
	 * @param {Array} chunks - Array of HTML elements
	 * @return {Promise}
	 */
	load(chunks){
		this.roles = this.roles || [];
		
		/** We were already given the data to work off, no need to fetch anything. */
		if(chunks)
			return this.getMemberInfo(...chunks);
		
		
		/** Otherwise, do things the trickier way */
		this.log("No lineup form passed; loading remotely");
		let url = `http://www.metal-archives.com/lineup/edit-roles/id/${this.id}`;

		return Scraper.getHTML(url).then(window => {
			this.log("Data received");

			let document       = window.document;
			let $              = s => document.querySelector(s);
			let unlistedBand   = ($("input[name^='unlistedBand']") || {}).value;
			
			/** Store the name of an unlisted band */
			if(unlistedBand)
				this.for = unlistedBand;
			
			
			/** This member's not been associated with a Resource instance yet */
			else if(!this.for){
				let bandName  = $(".band_name");
				let albumName = $(".album_name");

				/** Album line-up */
				if(albumName){
					let albumID = albumName.innerHTML.match(/href="[^"]+\/(\d+)"/i)[1];
					let album   = Release.get(albumID);
					if(!album){
						album       = new Release(albumID);
						album.name  = albumName.textContent.trim();
						album.for   = Release.bandsInTitle(bandName);
					}
					this.for = album;
				}
				
				/** Band line-up */
				else{
					let bandID = bandName.innerHTML.match(/href="[^"]+\/(\d+)"/i)[1];
					let band   = Band.get(bandID);
					if(!band){
						band      = new Band(bandID);
						band.name = bandName.textContent.trim();
					}
					this.for = band;
				}
			}
			
			return this.getMemberInfo(
				$("tr[id^='artist_']"),
				$("tr[id^='roleList_']")
			);
		});
		
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
		let active   = $("input[type='checkbox'][id^='status_']");
		if(active)
			this.active  = active.checked;
		
		
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
