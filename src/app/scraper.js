"use strict";

import Feedback from "./feedback.js";

const BASE_URL = "http://www.metal-archives.com/";


class Scraper{

	/**
	 * Authenticates the session with MA's server before pulling data.
	 *
	 * Note that an account is required to have moderator permissions.
	 *
	 * @param {String} username
	 * @param {String} password
	 * @return {Promise}
	 * @static
	 */
	static init(username, password){

		return new Promise((resolve, reject) => {
			
			/** Skip everything if we've been given presupplied cookie data */
			if(this.cookie){
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

				this.cookie = result.headers["set-cookie"];
				
				/** Attempt to access a moderator-only page to verify we have required privileges */
				return fetch("http://www.metal-archives.com/blacklist", {
					headers: { cookie: this.cookie }
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
	 * Stores a generated login cookie.
	 *
	 * @param {String|Array} data - An array of cookie headers
	 * @static
	 */
	static set cookie(data){

		/** Create a shared cookie repository if we haven't done so yet */
		this.cookieJar = this.cookieJar || new JSDom.createCookieJar();

		/** Make sure we actually have data before bothering to do anything */
		if(data){
			
			/** Wrap solitary strings in an array */
			if(!Array.isArray(data))
				data = [data];

			data.map(CookieJar.parse).map(c => this.cookieJar.setCookieSync(c+"", BASE_URL));
		}
	}


	/**
	 * Retrieves the session's login cookie as a concatenated list of RFC6265-style headers.
	 *
	 * @return {String}
	 * @static
	 */
	static get cookie(){
		return this.cookieJar ? this.cookieJar.getCookieStringSync(BASE_URL) : "";
	}




	/**
	 * Asynchronously loads an HTML page as a DOM tree.
	 *
	 * @param {String} url - Absolute URL of the HTML page to retrieve
	 * @return {Promise}
	 */
	static getHTML(url){

		return new Promise((resolve, reject) => {
			JSDom.env({
				cookieJar: this.cookieJar,
				url:    url,
				done:   (error, window) => {
					if(error) reject(error);
					resolve(window);
				}
			});
		}).catch(error => {
			Feedback.error(error);
			Feedback.error("Attempting to reload HTML document: " + url);
			return this.getHTML(url);
		});
	}
	
	
	
	/**
	 * Asynchronously loads a page as a plain-text document.
	 *
	 * @param {String} url - Absolute URL of the page to retrieve
	 * @return {Promise}
	 */
	static get(url){
		
		return new Promise((resolve, reject) => {
			let args = {headers: {cookie: this.cookie}};
			
			fetch(url, args)
				.catch(error => reject(error))
				.then(result => {
					result.text().then(text => resolve(text, result));
				});
		}).catch(error => {
			Feedback.error(error);
			Feedback.error("Reloading URL: " + url);
			return this.get(url);
		});
	}
}


export default Scraper;
