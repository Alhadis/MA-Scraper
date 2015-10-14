"use strict";

import Resource  from "./resource.js";
import Scraper   from "./scraper.js";


class Band extends Resource{
	
	constructor(id, autoload = true){
		super(id);
		
		if(autoload)
			this.load();
	}


	load(){
		let url = `http://www.metal-archives.com/band/edit/id/${this.id}`;

		Scraper.getHTML(url).then(window => {
			console.log(`DOM: ${window.document.documentElement.outerHTML}`);
			return;

			let document	= window.document;

			/** Start pulling out vitals */
			this.name		= document.getElementById("bandName");
			console.log(this.name);

		}).catch(Scraper.error);
	}
}

export default Band;
