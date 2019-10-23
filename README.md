# MSPA-Scraper
WIP tool to download a local copy of MSPaint Adventures.
Install with NPM, then run with "npm scrape". To change the output folder, adjust the "outputDir" variable towards the top of scrape.js.

What it does:

* Goes through the metadata sitting on MSPA's servers and generates a JSON object for each page. 
Saves it all in one big file and I should probably rethink that.
* Grabs all images, flashes, videos, and generally anything else important to the flow of the website. 
Adjust hyperlinks to matching local addresses.
* External Youtube videos (Bunny in the Box etc) are pulled in HD from a private rehost on Vimeo. 
Should protect them all from any future copyright blocks.

Currently a work in progress, but it should behave with all standard format pages. Still need to get it friendly with:
* Sweet Bro and Hella Jeff
* A6A5A1x2 Combo
* Problem Sleuth bonus pages
* Flashes that link to external files (Like Dave's Beat Machine)
* Meenahbound in general
* Website assets (style related images, some story scraps)
* Paradox Space (less essential)
