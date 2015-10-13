#!/usr/local/bin/node --es_staging
"use strict";

let FormData    = require("form-data");
let http        = require("http");
let fs          = require("fs");
let queryString = require("querystring");

let json		= JSON.parse(fs.readFileSync(".devrc.json"));
let data		= queryString.stringify({
	loginUsername:	json.username,
	loginPassword:	json.password,
	origin:			"/"
});



let opts	= {
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
};

let request	= http.request(opts, result => {
	let cookie = result.headers["set-cookie"];
		cookie = json.map(s => s.split(/; /)[0]).join("; ");
});

request.on("error", e => console.log(`PROBLEM: ${e}`));

request.write(data);
request.end();
