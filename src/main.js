"use strict";

/** App-specific logic */
import Scraper   from "./app/scraper.js";
import Feedback  from "./app/feedback.js";
import Exporter  from "./app/exporter.js";

/** Resource definitions */
import Band      from "./resources/band.js";
import Artist    from "./resources/artist.js";
import Release   from "./resources/release.js";
import Resource  from "./resources/resource.js";
import Member    from "./resources/member.js";
import Report    from "./resources/report.js";


/** Runtime configuration */
let creds      = JSON.parse(fs.readFileSync(".devrc.json"));
let username   = creds.username;
let password   = creds.password;
let cookie     = creds.cookie;


/** Login and get rockin' */
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
		
		try{
			let Alturiak = new Band(3540334729);

			Alturiak.load()
				.then(() => {
					console.warn("Done!");
					console.log(Exporter.JSON());
					creds.listOnExit && Resource.list();
				})
				.catch(e => {
					Feedback.error(e);
					process.exit(2);
				})

		} catch(e){ Feedback.error(e); }
	});
