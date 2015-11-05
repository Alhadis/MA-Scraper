#!/usr/local/bin/node --es_staging
"use strict";

/** Load core Node.JS modules */
global.util         = require("util");
global.fs           = require("fs");
global.process      = require("process");
global.HTTP         = require("http");
global.queryString  = require("querystring");

/** Load top-level NPM modules */
global.Babel        = require("babel-core/register");
global.JSDom        = require("jsdom");
global.fetch        = require("node-fetch");
global.CookieJar    = require("tough-cookie");

/** Start the program */
require("./src/main.js");
