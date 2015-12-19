"use strict";

/** App-specific logic */
import Options   from "./options.js";
import Feedback  from "./feedback.js";
import Countries from "./countries.js";
import Exporter  from "./exporter.js";

/** Data lists */
import Blacklist from "../data-lists/blacklist.js";

/** Resource definitions */
import Band      from "../resources/band.js";
import Artist    from "../resources/artist.js";
import Release   from "../resources/release.js";
import Resource  from "../resources/resource.js";
import Member    from "../resources/member.js";
import Report    from "../resources/report.js";
import File      from "../resources/file.js";
import Edit      from "../resources/edit.js";
import Label     from "../resources/label.js";
import Link      from "../resources/link.js";
import Review    from "../resources/review.js";
import Role      from "../resources/role.js";
import Track     from "../resources/track.js";
import User      from "../resources/user.js";
import Vote      from "../resources/vote.js";


/** Constants */
const BASE_URL = "http://www.metal-archives.com/";


/** Private variables */
let options, creds, username, password, cookie, cookieJar;



class Scraper{
	
	/** Exportable resource types */
	exportables = {Artist, Band, Edit, Label, Link, Member, Release, Report, Review, Role, Track, User, Vote};
	
	
	/**
	 * Parse the user's command-line input and start the program.
	 *
	 * @constructor
	 */
	constructor(){
		options       = new Options(process.argv.slice(2));
		
		/** Display help message if requested */
		options.help && this.exec("help");
		
		/** Load user credentials */
		try{
			creds     = JSON.parse(fs.readFileSync(options.userConfig));
			username  = creds.username;
			password  = creds.password;
			this.storeCookie(creds.cookie);
		} catch(error){
			Feedback.error("Unable to load configuration file: " + options.userConfig);
			process.exit(5);
		}
		
		/** Invoke the necessary instruction */
		this.exec.call(this, ...options.argv);
	}
	
	
	
	/**
	 * Run a named subcommand.
	 *
	 * @param {String}   name - Name of the subcommand
	 * @param {...Mixed} args - List of parameters passed to command
	 * @return {Boolean} TRUE if the named command existed; FALSE otherwise
	 */
	exec(name, ...args){
		name = (name || "").toLowerCase();
		
		switch(name){
			
			/** Print a short inline help message and bail */
			case "help":{
				Feedback.help();
				process.exit(0);
				break;
			}
			
			/** Export the site's blacklist */
			case "blacklist":{
				this.exportBlacklist();
				break;
			}
			
			/** Assume the "command" is really the name of a resource-type to export */
			default:{
				this.extract(name, ...args);
				break;
			}
		}
	}
	
	
	
	/**
	 * Export a resource from the Metal Archives.
	 *
	 * @param {String} type - Type of resource to export, checked case-insensitively
	 * @param {String} id   - Resource's unique identifier
	 * @return {Promise}
	 */
	extract(type, id){
		
		/** Bark if no resource-type was given */
		if(!type){
			Feedback.error("No resource type specified");
			process.exit(2);
		}
		
		/** Assume sentence-case for the specified resource-type; saves us bothering about case-sensitivity */
		let resourceClass = type[0].toUpperCase() + type.toLowerCase().substr(1);
		
		/** An invalid resource type was specified */
		if(!(resourceClass = this.exportables[resourceClass])){
			let examples  = [""].concat(Object.keys(this.exportables)).join("\n  - ").toLowerCase();
			let message   = `"${type}" is not an exportable resource. Use one of the following: ${examples}\n`;
			Feedback.error(message);
			process.exit(4);
		}
		
		/** Valid resource-type given, but no ID... */
		if(!id){
			Feedback.error("No resource ID specified");
			process.exit(3);
		}
		
		
		
		/** Login and get rockin' */
		return this.auth(username, password)
			.catch(e => { this.invalid = true; Feedback.error(e); })
			.then(m  => {
				
				/** Bail if there was a problem authenticating the user */
				if(this.invalid){
					Feedback.error("Could not authorise user. Aborting.");
					process.exit(1);
					return;
				}
				
				try{
					let subject  = new resourceClass(id);
					let loadArgs = [];
					
					/** If it's an Artist being exported, include a shallow copy of their bands list */
					if(Artist === resourceClass)
						loadArgs = [true];
					
					
					/** Let's get loading */
					subject.load.apply(subject, loadArgs)
					
						/** All data's loaded; make sure all Users have IDs available */
						.then(() => User.validate())
						
						
						/** Done! */
						.then(() => {
							let done = () => {
								console.warn("Done!");
								console.log(Exporter.JSON(Exporter.getAll(), options.prettyPrint));
							};
							
							/** Decide if we need to load the images, too */
							let {embedImages, saveImages} = options;
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
								return File.loadAll(saveImages).then(() => {
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
	}



	/**
	 * Authenticate the session with MA's server before pulling data.
	 *
	 * Note that an account is required to have moderator permissions.
	 *
	 * @param {String} username
	 * @param {String} password
	 * @return {Promise}
	 */
	auth(username, password){

		return new Promise((resolve, reject) => {
			
			/** Skip everything if we've been given presupplied cookie data */
			if(cookie){
				console.warn(`Using presupplied cookie data`);
				return resolve();
			}
						
			
			/** Bail if login credentials weren't supplied */
			if(!username || !password)
				return reject(`${username ? "Password" : "Username"} not supplied`);


			/** Synthesise a submitted form-data string */
			let data = queryString.stringify({
				loginUsername:  username,
				loginPassword:  password,
				origin:         "/"
			});

			let request	= HTTP.request({
				hostname: "www.metal-archives.com",
				path:     "/authentication/login",
				method:   "POST",
				headers:  {
					"Accept":           "text/html,application/xhtml+xml,application/xml;q=0.9",
					"Accept-Encoding":  "gzip, deflate",
					"Accept-Language":  "en-AU,en;q=0.8",
					"Cache-Control":    "no-cache",
					"Connection":       "keep-alive",
					"Content-Length":   data.length,
					"Content-Type":     "application/x-www-form-urlencoded",
					"Origin":           "http://www.metal-archives.com",
					"Pragma":           "no-cache",
					"Referer":          BASE_URL
				}
			}, result => {

				this.storeCookie(result.headers["set-cookie"]);
				
				/** Attempt to access a moderator-only page to verify we have required privileges */
				return fetch("http://www.metal-archives.com/blacklist", {
					headers: { cookie: cookieJar.getCookieStringSync(BASE_URL) }
				}).then(result => {
					(403 == result.status) ?
						reject(`User ${username} lacks moderator permissions.`) :
						resolve();
				});
			});


			request.on("error", Feedback.error);
			request.write(data);
			request.end();
		});
	}



	/**
	 * Store a generated login cookie.
	 *
	 * @param {String|Array} data - An array of cookie headers
	 */
	storeCookie(data){

		/** Create a shared cookie repository if we haven't done so yet */
		cookieJar = cookieJar || new JSDom.createCookieJar();

		/** Make sure we actually have data before bothering to do anything */
		if(data){
			cookie = data;
			
			/** Wrap solitary strings in an array */
			if(!Array.isArray(data))
				data = [data];

			data.map(CookieJar.parse).map(c => cookieJar.setCookieSync(c+"", BASE_URL));
		}
	}
	
	
	/**
	 * Export the site's blacklist in JSON format, sending the result to STDOUT.
	 *
	 * @return {Promise}
	 */
	exportBlacklist(){
		
		return this.auth(username, password)
			.then(Countries::Countries.load)
			.then(() => {
				console.warn("Blacklist: Loading");
				
				return new Blacklist().load()
					.then(result => {
						console.warn("Blacklist: Received");
						let items   = [];
						
						for(let i of result.data){
							let [name, country, details] = i;
							let [, id, reason, by, on]   = details.match(/^<span id="reason_(\d+)">(.*?)(?:(?:<\/span>)?\s*<em id="date_\d+">\((.+?), (\d{4}-\d{2}-\d{2})\)<\/em>)?$/mi);
							
							let entry = { name };
							if(country)                  entry.country = Countries[country];
							if((reason || "").trim())    entry.reason  = reason.replace(/\x20$/, "");
							if(by)                       entry.by      = new User(by);
							if(on)                       entry.on      = on + " 00:00:00";
							items.push([+id, entry]);
						}
						
						/** Sort results by their internal ID */
						items.sort((a, b) => {
							let A = a[0];
							let B = b[0];
							if(A < B) return -1;
							if(A > B) return 1;
							return 0;
						});
						
						/** Flatten the now-sorted list of blacklist entries */
						let output = {};
						items.forEach(o => {
							let [id, data] = o;
							output[id]     = data;
						});
						
						return User.validate().then(() => {
							console.warn("Done!");
							console.log(Exporter.JSON(output, options.prettyPrint));
						});
					}).catch(error => {
						Feedback.error(error);
					})
			});
	}




	/**
	 * Asynchronously load an HTML page as a DOM tree.
	 *
	 * @param {String} url - Absolute URL of the HTML page to retrieve
	 * @return {Promise}
	 */
	static getHTML(url){

		return new Promise((resolve, reject) => {
			JSDom.env({
				cookieJar, url,
				done: (error, window) => {
					if(error) reject(error);
					resolve(window);
				}
			});
		}).catch(error => {
			Feedback.error(error);
			Feedback.error("Attempting to reload HTML document: " + url);
			return new Promise(resolve => setTimeout(resolve, 1000)).then(() => this.getHTML(url));
		});
	}
	
	
	
	/**
	 * Asynchronously load a page as a plain-text document.
	 *
	 * @param {String} url - Absolute URL of the page to retrieve
	 * @return {Promise}
	 */
	static get(url){
		
		return new Promise((resolve, reject) => {
			let args = {headers: {cookie: cookieJar ? cookieJar.getCookieStringSync(BASE_URL) : "" }};
			
			fetch(url, args)
				.catch(error => reject(error))
				.then(result => {
					result.text().then(text => resolve(text, result));
				});
		}).catch(error => {
			Feedback.error(error);
			Feedback.error("Reloading URL: " + url);
			return new Promise(resolve => setTimeout(resolve, 1000)).then(() => this.get(url));
		});
	}
}


export default Scraper;
