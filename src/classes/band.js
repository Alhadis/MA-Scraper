"use strict";

import Resource  from "./resource.js";
import Scraper   from "../scraper.js";


export class Band extends Resource{

	load(){
		let url = `http://www.metal-archives.com/band/edit/id/${this.id}`;

		Scraper.getHTML(url).then(window => {
			console.log(window.document.documentElement.outerHTML);
			return;

			let document	= window.document;

			/** Start pulling out vitals */
			this.name		= document.getElementById("bandName");
			console.log(this.name);
		});
	}
}
