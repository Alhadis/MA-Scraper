"use strict";

import Band      from "./classes/band.js";
import Artist    from "./classes/artist.js";


export class Scraper{

	/**
	 * Authenticates the session with MA's server before pulling data.
	 *
	 * Note that your account is required to have moderator permissions.
	 *
	 * @param {String} username
	 * @param {String} password
	 * @return {Promise}
	 * @static
	 */
	static init(username, password){

		/** Bail if login credentials weren't supplied */
		if(!username || !password){
			let message = `${username ? "Password" : "Username"} not supplied`;
			throw new Error(message);
		}


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
				"Referer":          "http://www.metal-archives.com/"
			}
		}, result => {
			let cookies    = result.headers["set-cookie"];

			/** Store the generated login cookie */
			this.cookieJar = cookies.map(CookieJar.parse);
			
		});
		
		
		request.on("error", e => { console.error(e); });
		request.write(data);
		request.end();
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
				url:    url,
				done:   (error, window) => {
					if(error) reject(error);
					resolve(window);
				}
			});
		});
	}
}
