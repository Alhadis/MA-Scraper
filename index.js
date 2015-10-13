#!/usr/local/bin/node --es_staging
"use strict";

/** Load core Node.JS modules */
global.util         = require("util");
global.fs           = require("fs");
global.process      = require("process");
global.HTTP			= require("http");
global.queryString  = require("querystring");

/** Load top-level NPM modules */
global.Babel        = require("babel");
global.JSDom        = require("jsdom");
global.fetch        = require("node-fetch");
global.CookieJar    = require("tough-cookie");

const RED           = "\x1B[38;5;196m";
const BOLD          = "\x1B[1m";
const RESET         = "\x1B[0m";


/** Top-level wrapper to enable ES6 module importing/exporting */
const ES6ModuleLoader		= require("es6-module-loader").System;
ES6ModuleLoader.transpiler	= "babel";
ES6ModuleLoader.import("./src/scraper.js")
	.catch(e => { console.error(e); })
	.then(m  => {
		let creds     = JSON.parse(fs.readFileSync(".devrc.json"));
		let username  = creds.username;
		let password  = creds.password;

		let onError   = e => console.error(`${RED}${BOLD}ERROR${RESET}${RED}: ${e}${RESET}`);

		try{
			m.Scraper.init(username, password)
				.then(m => { new Band(3540334729); })
				.catch(e);
		} catch(e){ onError(e); }
	})
