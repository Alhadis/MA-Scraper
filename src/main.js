"use strict";

/** App-specific logic */
import Scraper   from "./app/scraper.js";
import Feedback  from "./app/feedback.js";
import Exporter  from "./app/exporter.js";
import Countries from "./app/countries.js";

/** Resource definitions */
import Band      from "./resources/band.js";
import Artist    from "./resources/artist.js";
import Release   from "./resources/release.js";
import Resource  from "./resources/resource.js";
import Member    from "./resources/member.js";
import Report    from "./resources/report.js";
import File      from "./resources/file.js";
import Edit      from "./resources/edit.js";
import Label     from "./resources/label.js";
import Link      from "./resources/link.js";
import Review    from "./resources/review.js";
import Role      from "./resources/role.js";
import Track     from "./resources/track.js";
import User      from "./resources/user.js";
import Vote      from "./resources/vote.js";


/** Parse CLI arguments */
let {options, argv} = getOptions(process.argv.slice(2), {
	"-h, --help":          "",
	"-e, --embed-images":  "",
	"-p, --pretty-print":  "",
	"-s, --save-images":   "<path>",
	"-l, --log-level":     "<n=\\d+>",
	"-u, --user-config":   "<path>"
});


/** Display help message if requested */
if(options.help){
	Feedback.help();
	process.exit(0);
}



/** Normalise option values, deferring to defaults when omitted */
let embedImages  = options.embedImages;
let saveImages   = options.saveImages;
let logLevel     = options.logLevel   || 4;
let userConfig   = options.userConfig || ".devrc.json";


let resourceType = argv[0];
let resourceID   = argv[1];

/** Check the user provided the necessary parameters */
if(!resourceType){
	Feedback.error("No resource type specified");
	process.exit(2);
}

if(!resourceID){
	Feedback.error("No resource ID specified");
	process.exit(3);
}


/** Exportable resource types */
let validTypes    = {Artist, Band, Edit, Label, Link, Member, Release, Report, Review, Role, Track, User, Vote};

/** Assume sentence-case for the specified resource-type; saves us bothering about case-sensitivity */
let resourceClass = resourceType[0].toUpperCase() + resourceType.toLowerCase().substr(1);

/** An invalid resource type was specified */
if(!(resourceClass = validTypes[resourceClass])){
	let examples  = [""].concat(Object.keys(validTypes)).join("\n  - ").toLowerCase();
	let message   = `"${resourceType}" is not an exportable resource. Use one of the following: ${examples}\n`;
	Feedback.error(message);
	process.exit(4);
}


/** Load user credentials */
let creds, username, password, cookie;
try{
	creds        = JSON.parse(fs.readFileSync(userConfig));
	username     = creds.username;
	password     = creds.password;
	cookie       = creds.cookie;
} catch(error){
	Feedback.error("Unable to load configuration file: " + userConfig);
	process.exit(5);
}



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
			let subject  = new resourceClass(resourceID);
			let loadArgs = [];
			
			/** If it's an Artist being exported, include a shallow copy of their bands list */
			if(Artist === resourceClass)
				loadArgs = [true];
			
			
			/** Let's get loading */
			subject.load.apply(subject, loadArgs)
			
				/** Last-minute check we have a map of country codes/names available */
				.then(() => !Countries.loaded ? Countries.load() : Promise.resolve())
				
				
				/** All data's loaded; make sure all Users have IDs available */
				.then(() => {
					console.warn("Checking for users with missing IDs");
					let promises = [];
					
					/** Run through all users and check we've got their IDs */
					let users = User.getAll();
					for(let i in users){
						let user = users[i];
						
						/** Only bother with active users whose internal IDs are still absent */
						if(!user.name && !user.deactivated)
							promises.push(user.load());
					}
					
					return Promise.all(promises).then(() => {
						
						/** Fix the country fields for all Users so they're represented by their ISO code/ID */
						for(let i in users){
							let user     = users[i];
							let name     = user.country;
							if(name){
								user.country = Countries[name];
								user.log(`Country ID set: "${name}" -> ${user.country}`);
							}
						}
					});
				})
				
				
				/** Done! */
				.then(() => {
					let done = () => {
						console.warn("Done!");
						console.log(Exporter.JSON(options.prettyPrint));
					};
					
					/** Decide if we need to load the images, too */
					if(embedImages || saveImages){
						console.warn("\nFinished loading data. Loading images.");
						
						/** If given a directory to save images to, make sure it exists */
						if(saveImages){
							
							/** Resolve any paths relative to the user's working directory */
							let cwd    = process.cwd();
							process.chdir(oldpwd);
							mkdirp.sync(saveImages);
							saveImages = fs.realpathSync(saveImages);
							console.warn("saveImages path resolved to: " + saveImages);
							process.chdir(cwd);
						}
						
						File.embedData = embedImages;
						File.loadAll(saveImages).then(() => {
							console.warn("Finished loading images.");
							done();
						}).catch(e => {
							Feedback.error(e);
							process.exit(7);
						});
					}
					
					/** Nope, no more loading to do. We're done here. */
					else done();
				})
				.catch(e => {
					Feedback.error(e);
					process.exit(6);
				});

		} catch(e){ Feedback.error(e); }
	});
