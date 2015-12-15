"use strict";

import Feedback   from "../app/feedback.js";
import Scraper    from "../app/scraper.js";
import Resource   from "./resource.js";


class File extends Resource{
	
	/**
	 * Create a new file reference.
	 *
	 * @param {String} url - Absolute URL to the remote resource.
	 * @constructor
	 */
	constructor(url){
		super(url);
		
		/** Break the URL apart and store its separate path components for convenience */
		if(url){
			let parts     = url.match(/^([^\/#\?]*:?\/\/)?(\/?(?:[^\/#\?]+\/)*)?([^\/#\?]+)?(?:\/(?=$))?(\?[^#]*)?(#.*)?$/);
			this.pathname = (parts[2] || "").replace(/^(?:www\.)?metal-archives\.com\/?/, "");
			this.filename =  parts[3] || "";
		}
	}


	
	/**
	 * Fetch and store the binary content of the File instance's URL.
	 *
	 * @return {Promise}
	 */
	load(){
		
		/** Don't bother doing anything if there's nothing to load */
		if(!this.id) return Promise.resolve();
		
		return new Promise((resolve, reject) => {
			this.log("Loading: File data");
			let chunks = [];
			
			HTTP.get(this.id, result => {
				this.log("Reading: File data");
				this.contentType = result.headers["content-type"];
				
				result
					.on("data", chunk => chunks.push(chunk))
					.on("end",  () => {
						this.log("Finished: File data");
						this.data = Buffer.concat(chunks);
						resolve();
					});
			
			}).on("error", error => {
				Feedback.error(`Trouble loading file from ${this.id}`);
				reject(error);
			})
		});
	}
	
	
	
	/**
	 * Display only the filename component of a File's URL in logging feedback.
	 *
	 * @param {String} text - String to send to terminal
	 * TODO: Improve how Feedback handles parameters to control formatting
	 */
	log(message){
		
		/** Do a stupid switch to override what the Feedback class uses to display a string */
		if(this.id){
			let url = this.id;
			this.id = this.filename;
			super.log(message);
			this.id = url;
		}
	}
	
	
	
	/**
	 * Return the base64-encoded representation of the File's contents.
	 *
	 * If the instance's data hasn't been populated yet, this method returns null.
	 *
	 * @return {String|Null}
	 */
	toBase64(){
		if(!this.data) return null;
		
		return this.data.toString("base64");
	}
	
	
	
	/**
	 * Asynchronously write the File's loaded contents to the local filesystem.
	 *
	 * @return {Promise}
	 */
	save(filename){
		
		/** Sanity check */
		if(!filename)
			return Promise.reject("No filename specified");
		
		return new Promise((resolve, reject) => {
			fs.writeFile(filename, this.data, error => error ? reject() : resolve());
		});
	}
	
	
	
	/**
	 * Return either the file's URL or its base64-encoded contents if File.embedData is true
	 *
	 * If the instance's data hasn't been loaded yet, the URL is always returned irrespective
	 * of the class's .embedData property.
	 *
	 * @return {String}
	 */
	toJSON(property){
		if(this.constructor.embedData && this.data)
			return `data:${this.contentType};base64,` + this.toBase64();
		else return super.toJSON(property);
	}
	
	
	
	/**
	 * Helper method to load the binary content of every File instance that's been created.
	 *
	 * @param {String} saveTo - If specified, will save the file's data to the given directory
	 * @return {Promise}
	 */
	static loadAll(saveTo){
		let promises = [];
		let files    = File.getAll();
		for(let i in files)
			files[i].data || i && promises.push(files[i].load().then(() => {
				let f = files[i];
				if(saveTo && f.data)
					return f.save(saveTo.replace(/\/*$/, "/") + f.filename);
				return Promise.resolve();
			}));
		
		return Promise.all(promises);
	}
}


export default File;
