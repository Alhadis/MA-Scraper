"use strict";

import Band      from "./classes/band.js";
import Artist    from "./classes/artist.js";
import Scraper   from "./classes/scraper.js";
import Feedback  from "./classes/feedback.js";
import Resource  from "./classes/resource.js";

let creds      = JSON.parse(fs.readFileSync(".devrc.json"));
let username   = creds.username;
let password   = creds.password;
let cookie     = creds.cookie;

Scraper.cookie = cookie;
Scraper.init(username, password)
	.catch(e => { Scraper.invalid = true; Feedback.error(e); })
	.then(m  => {
		
		/** Bail if there was a problem authenticating the user */
		if(Scraper.invalid){
			Feedback.error("Could not authorise user. Aborting.");
			process.exit(1);
			return;
		}
		/*
		let Alturiak = 3540334729;
		new Band(3540297142).load()*/
		new Artist(265).load()
			.catch(e => Feedback.error(e))
			.then(() => {
				console.log('Done!');
				creds.listOnExit && Resource.list();
			});
	});
