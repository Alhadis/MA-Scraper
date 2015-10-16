"use strict";

import Resource from "./resource.js";
import Scraper  from "./scraper.js";


/** Role-type constants */
const ROLE_BANNED      = "banned";
const ROLE_MEMBER      = "member";
const ROLE_VETERAN     = "veteran";
const ROLE_TRUSTED     = "trusted";
const ROLE_SUPERUSER   = "superuser";
const ROLE_MOD         = "mod";

let roles = {
	"Dishonourably Discharged": ROLE_BANNED,
	"Fred Durst":               ROLE_BANNED,
	"Mallcore kid":             ROLE_MEMBER,
	"Metal newbie":             ROLE_MEMBER,
	"Metalhead":                ROLE_MEMBER,
	"Veteran":                  ROLE_VETERAN,
	"Metal freak":              ROLE_TRUSTED,
	"Metal demon":              ROLE_TRUSTED,
	"Metal knight":             ROLE_SUPERUSER,
	"Metal lord":               ROLE_MOD,
	"Webmaster":                ROLE_MOD
};



class User extends Resource{


	load(){
		this.log("Load started");
		return Promise.all([
			this.loadCore()
		]);
	}
	
	
	
	loadCore(){
		this.log("Loading: Main data");
		let url = "http://www.metal-archives.com/users/" + encodeURIComponent(this.id);

		return Scraper.getHTML(url).then(window => {
			this.log("Received: Main data");

			let document     = window.document;
			let $            = s => document.querySelector(s);

			/** If .name is blank, it means it's still sitting in .id because we haven't retrieved the numeric ID yet */
			if(!this.name){
				let source   = document.documentElement.innerHTML;
				this.name    = this.id;
				this.id      = source.match(/"http:\/\/www\.metal-archives\.com\/user\/tab-bands\/id\/(\d+)\/?"/i)[1];
			}


			/** Initialise the user's collection lists, if needed */
			if(!this.lists){
				this.lists   = {
					collection: [],
					trade:      [],
					wish:       []
				};
			}



			/** Extract basic user info */
			let info         = {};
			let infoList     = document.querySelector("#user_info > dl.float_left");
			for(let el of Array.from(infoList.children)){
				let html     = el.innerHTML.replace(/&nbsp;/gi, " ");
				
				if("DT" === el.tagName){
					let name    = el.textContent.replace(/(^\s*|\s*:\s*$)/gi, "");
					let dd      = el.nextElementSibling;
					let value;

					switch(name){
						case "Email address":{
							value = dd.firstElementChild.rel.replace("//", "@").replace("/", ".").split("").reverse().join("");
							break;
						}
						
						case "Homepage":{
							value = dd.textContent.trim();
							break;
						}
						
						case "Comments":{
							let p        = dd.nextElementSibling;
							p.innerHTML  = p.innerHTML.replace(/<br\s*\/?>\n?/gi, "\n");
							value        = p.textContent.trim();
							break;
						}
						
						case "Joining/last used IP":{
							let link     = dd.firstElementChild;
							if(link)
								value    = link.textContent;
							break;
						}
						
						default:{
							value = dd.textContent.trim();
							break;
						}
					}
					
					/** Fields that a user leaves blank are often displayed as "N/A". Skip them. */
					if("N/A" !== value)
						info[name] = value;
				}
			}
			
			
			this.rank        = info["Rank"];
			this.points      = info["Points"];
			this.email       = info["Email address"];
			this.fullName    = info["Full name"];
			this.gender      = info["Gender"][0];
			this.age         = info["Age"];
			this.country     = info["Country"];
			this.url         = info["Homepage"];
			this.favGenres   = info["Favourite metal genre(s)"];
			this.comments    = info["Comments"];
			this.registered  = info["Registration date"];
			this.ip          = info["Joining/last used IP"];
			this.modNotes    = $('textarea[name="mod_notes"]').value;
			this.role        = roles[this.rank];
		});
	}
}

export default User;
