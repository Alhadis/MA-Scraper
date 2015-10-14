"use strict";

class Scraper{

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

		/** Create a shared cookie repo for JSDom; this'll store the generated login cookie */
		this.cookieJar = new JSDom.createCookieJar();


		return new Promise((resolve, reject) => {

			/** Synthesise a submitted form-data string */
			let data = queryString.stringify({
				loginUsername:  username,
				loginPassword:  password,
				origin:         "/"
			});

			let baseURL	= "http://www.metal-archives.com/";
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
					"Referer":          baseURL
				}
			}, result => {
				
				result.headers["set-cookie"]
					.map(CookieJar.parse)
					.map(c => { this.cookieJar.setCookieSync(c+"", baseURL) });
				
				/** Attempt to access a moderator-only page to verify we have required privileges */
				return fetch("http://www.metal-archives.com/blacklist", {
					headers: { cookie: this.cookieJar.getCookieStringSync(baseURL) }
				}).then(result => {
					(403 == result.status) ?
						reject(`User ${username} lacks moderator permissions.`) :
						resolve();
				});
			});


			request.on("error", e => console.error(e));
			request.write(data);
			request.end();
		});
	}



	/**
	 * Asynchronously loads an HTML page as a DOM tree.
	 *
	 * @param {String} url - Absolute URL of the HTML page to retrieve
	 * @return {Promise}
	 */
	static getHTML(url){
		console.log(`COOKIE JAR: ${this.cookieJar}`);

		return new Promise((resolve, reject) => {
			JSDom.env({
				cookieJar: this.cookieJar,
				url:    url,
				done:   (error, window) => {
					if(error) reject(error);
					resolve(window);
				}
			});
		});
	}
}


export default Scraper;