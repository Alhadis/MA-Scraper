"use strict";

import Scraper  from "../app/scraper.js";
import Feedback from "../app/feedback.js";
import Resource from "./resource.js";


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
		return super.load([
			this.loadCore
		]);
	}


	
	loadCore(){
		this.log("Loading: Main data");
		let url = "http://www.metal-archives.com/users/" + encodeURIComponent(this.id);

		return Scraper.getHTML(url).then(window => {
			this.log("Received: Main data");

			let document     = window.document;
			let $            = s => document.querySelector(s);
			
			/** Bail early if the user's deactivated their account */
			if(/^Error 404/i.test(document.title)){
				this.deactivated = true;
				return;
			}
			
			
			/** If .name is blank, it means it's still sitting in .id because we haven't retrieved the numeric ID yet */
			if(!this.name){
				let source   = document.documentElement.innerHTML;
				this.name    = this.id;
				this.id      = +source.match(/"http:\/\/www\.metal-archives\.com\/user\/tab-bands\/id\/(\d+)\/?"/i)[1];
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
							value = dd.firstElementChild.rel.replace("//", "@").replace(/\//g, ".").split("").reverse().join("");
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
			this.gender      = (info["Gender"] || "")[0];
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
	
	
	
	/**
	 * Return a JSON-friendly representation of the User's data.
	 *
	 * @param {String} property
	 * @return {Object}
	 */
	toJSON(property){
		if(property) return super.toJSON(property);
		
		let result             = {};
		let havePoints         = this.points || this.points === 0;
		
		if(this.id)            result.id           = this.id;
		if(this.name)          result.name         = this.name;
		if(this.rank)          result.rank         = this.rank;
		if(havePoints)         result.points       = this.points;
		if(this.email)         result.email        = this.email;
		if(this.fullName)      result.fullName     = this.fullName;
		if(this.gender)        result.gender       = this.gender;
		if(this.age)           result.age          = this.age;
		if(this.country)       result.country      = this.country;
		if(this.url)           result.url          = this.url;
		if(this.favGenres)     result.favGenres    = this.favGenres;
		if(this.comments)      result.comments     = this.comments;
		if(this.registered)    result.registered   = this.registered;
		if(this.ip)            result.ip           = this.ip;
		if(this.modNotes)      result.modNotes     = this.modNotes;
		if(this.role)          result.role         = this.role;
		if(this.deactivated)   result.deactivated  = true;
		if(this.lists)         result.lists        = this.lists;
		return result;
	}
	
	
	
	/**
	 * Export a JSON-friendly representation of every User instance that's been created.
	 *
	 * Analoguous to the superclass's method, except the returned hash enumerates users
	 * by username, rather than their numeric/internal ID.
	 *
	 * @return {Object}
	 */
	static toJSON(){
		let results   = {};
		let instances = this.getAll();
		
		for(let i in instances){
			let user     = instances[i];
			let key      = user.name;
			let value    = user.toJSON();
			
			/** User details haven't been loaded; rename the ID property so it makes more sense */
			if(!key){
				key        = user.id;
				value.name = key;
				delete value.id;
			}
			
			results[key] = value;
		}
		
		return results;
	}
}

export default User;
