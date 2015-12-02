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
				result
					.on("data", chunk => chunks.push(chunk))
					.on("end",  () => {
						this.log("Finished: File data");
						this.data = Buffer.concat(chunks);
						resolve();
					});
			});
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
	 * Helper method to load the binary content of every File instance that's been created.
	 *
	 * @return {Promise}
	 */
	static loadAll(){
		let promises = [];
		let files    = File.getAll();
		for(let i in files)
			files[i].data || i && promises.push(files[i].load());
		
		return Promise.all(promises);
	}
}


export default File;
