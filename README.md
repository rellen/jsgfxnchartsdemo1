JS GFX and Charts Demo #1
=========================

Two demos of data-driven web 2d graphics and charting using javascript frameworks in the browser and node.js on the server

Disk Usage Analyser using JIT Sunburst
--------------------------------------

This demo uses the [JIT](thejit.org) Sunburst visualisation to create a Baobab-like view of disk utilisation.
A node.js server scraping the output from the unix command du (actually wrapped in a shell script) is used to get the disk usage and to serve up the intial HTML pages and scripts.

A version of JIT is included in /public

### Depends on

* [node.js](http://nodejs.org/)
* [express](http://expressjs.com/)
* the du unix command

### How to run the demo

from the command line run 

	node du-node.js

browse to

	http://127.0.0.1:3000/jit-sunburst.html


Combined CPU Load Chart using Flot and AJAX or Web Sockets
----------------------------------------------------------

This demo displays a combined CPU load chart using [Flot](http://code.google.com/p/flot/).
Two versions are available, one that reloads the CPU load data using and AJAX call, and one that sets up a web sockets connection to the server and gets the new data pushed to it.
A node.js server scrapes the output of the sar unix command to get the CPU load data and expose the data as an AJAX resource and a web-socket.

A version of Flot is included in /public

### Depends on

* [node.js](http://nodejs.org/)
* [express](http://expressjs.com/)
* [socekt.io](http://socket.io/)
* the sar unix command (sysstat package in Debian and variants)

### NOTE: sar appears to have significant behaviour differences between operating systems.
Your mileage may vary.

### How to run the demo

from the command line run 

	node sar-node.js

browse to

	http://127.0.0.1:3001/flot-ts.html
	http://127.0.0.1:3001/flot-ts-sockets.html


