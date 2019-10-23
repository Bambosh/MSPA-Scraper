const fs = require('fs');
const mkdirp = require('mkdirp');
const request = require("request");
const ytdl = require('youtube-dl');
var ffb = require('ffbinaries');

const startPage = 1901;
const endPage = 2147;
const totalPages = endPage - startPage + 1;
var pagesReturned = pagesRequested = 0;
function currentPage() {return startPage + pagesRequested};

const workerMax = 1;
var workerCount = 0;

var data = {};

function flashTemplate (localPath){
	var filename = localPath.slice(localPath.lastIndexOf("/") + 1, localPath.lastIndexOf("."));

	var size = {x: 650, y:450};
	var classes = "";
	switch (filename){
		//CLOCKS
		case "03848": case "03857": case "06649": 
			size.y = 1612;
			break;
		// GENESIS FROG 
		case "04015": 
		// JOHN CURSOR
		case "06202":
			size.y = 800; 
			break;
		// SCRATCH ALTERNIA 
		case "04050": 
		// A6A6I1 SELECTION SCREEN
		case "06277":
		// A6A6I5 SELECTION SCREENS
		case "07482": case "07668": case "07677": case "07682": case "07689": case "07692": case "07696": case "07709": case "07721": case "07729": case "07762": case "07800": case "07905":
			size.y = 650;
			break;
		//TYPHEUS 
		case "07083":
			size.y = 1400
			break;
		//HOMOSUCK ANTHEM
		case "06240":
			size.y = 576;
			break;
	

		//A6A6I1 SELECTION SCREENS
		case "06369": case "06394": case "06398": case "06402": case "06413":
		//VRISKAGRAM 
		case "07445":
			size.x = 950;
			size.y = 600;
			classes = "fullpage"
			break;
		//CASCADE
		case "04106": 
		//DOTA
		case "04812": 
		//A6A6I4 FULLPAGERS
		case "07095": case "07122": 
		//SHE'S 8ACK
		case "07402": 
			size.x = 950;
			size.y = 650;
			classes = "fullpage"
			break;

		//REMEM8ER
		case "07953":
			size.x = 950;
			size.y = 675;
			classes = "fullpage"
			break;

		//HUGBUNP
		case "07921":
			size.x = 950;
			size.y = 700;
			classes = "fullpage"
			break;

		//GOLD PILOT
		case "A6A6I1":
			filename = "A6A6I1.swf";
			size.x = 950;
			size.y = 750;
			classes = "fullpage"
			break;
		//GAME OVER
		case "06898":
			size.x = 950;
			size.y = 786;
			classes = "fullpage"
			break;

		//CROWBARS
		case "05492": case "05777":
			size.x = 950;
			size.y = 1160;
			classes = "fullpage crowbar"
			break;
	}

	var result = 
`<embed\
 class="flash ${classes}"\
 src="${ localPath }"\
 id="${filename}"\
 quality="high"\
 width="${size.x}px"\
 height="${size.y}px"\
 allowscriptaccess="always"\
 allowfullscreen="false"\
 type="application/x-shockwave-flash"\
 pluginspage="http://www.macromedia.com/go/getflashplayer"\
 alt=""\
>`;

	return result;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function lastSecondExceptions(uri){
	return uri
			.replace( 'darkcage.swf', 'kcage.swf' )
			.replace( 'darkcage2.swf', 'cage2.swf' )
			.replace( /storyfiles\/hs2\/05492/, "007395")
			.replace( /storyfiles\/hs2(\/05777\.)gif/, "007680$1swf")
			.replace( '06276.swf', 'A6A6I1.swf' )
			.replace( /06898(\/06898\.)gif/, "GAMEOVER$1swf")

			.replace( /.*bunny\.mp4/, "https://vimeo.com/343697526" ) //Bunny 001920
			.replace( /.*howdoilive\.mp4/, "https://vimeo.com/343699455" ) //How do I live 004572
			.replace( /.*miracles\.mp4/, "https://vimeo.com/343702481" ) //Miracles 004718
			.replace( /.*rufio\.mp4/, "https://vimeo.com/343697335" ) //Rufio 005286
			.replace( /.*midnightcrew\.mp4/, "https://vimeo.com/343693205" ) //Midnight Crew 005627

			.replace( /.*08080\.webm/, "https://www.youtube.com/watch?v=Y5wYN6rB_Rg") //EOA6
			.replace( /.*08120\.webm/, "https://www.youtube.com/watch?v=FevMNMwvdPw") //A7
			.replace( /.*08123\.webm/, "https://www.youtube.com/watch?v=rMZU89jY2j8") //Credits
}

var download = function(uri, filename, callback){
	if (/mspaintadventures\.com/.test(uri)){
		request.head(uri, function(error, response, body){
			if ( response.statusCode == 200 ) {
				console.log(`${filename.slice(filename.lastIndexOf("/"))} \x1b[33m---> LOCATED MEDIA\x1b[0m`);
				request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
			}
			else{
				console.log("File not found. Skipping.");
				callback();
			}			
		});
	}
	else if (/youtube/.test(uri)){
		ytdl.exec(uri, ['-f', 'bestvideo[ext=webm]+bestaudio[ext=webm]/best', `--output=${filename}`], {}, callback); //.%(ext)s
	}
	else if (/vimeo/.test(uri)){
		ytdl.exec(uri, ['-f', 'bestvideo[ext=mp4]+bestaudio[ext=mp4]/best', '--video-password', 'homestuck', `--output=${filename}`], {}, callback); //.%(ext)s
	}
	else {
		console.log(`${filename.slice(filename.lastIndexOf("/"))} \x1b[33m---> Has an unrecognised domain. Not downloading that.\x1b[0m`);
	}
};

//Media is array of links to images/flashes
function downloadMedia(media){
	return new Promise(function(resolve, reject) {
		
		if (!Array.isArray(media))
			media = [media];
		
		let finishedDownloads = 0;
		let totalDownloads = media.length;		

		for (var i = 0; i < totalDownloads; i++){
			media[i] = media[i].replace(/www(\.mspa)/, "cdn$1");
			localUrl = media[i].replace(/^(.*?)\.com/, "..")
							.replace(/(\/advimgs\/)/, "/storyfiles/")
							.replace(/(\/ryanquest\/)/, "/storyfiles$1")
							.replace(/(Sfiles\/)/, "");

			localPath = localUrl.slice(0, localUrl.lastIndexOf("/"));

			uri = lastSecondExceptions(media[i]);

			if (!/mspaintadventures|youtube|vimeo/.test(uri)){
				console.log(`${localUrl.slice(localUrl.lastIndexOf("/"))} \x1b[33m---> Has an unrecognised domain. Not downloading that.\x1b[0m`);
				finishedDownloads += 1;
				if (finishedDownloads == totalDownloads) resolve("Download Finished");
				continue
			}

			if (fs.existsSync(localUrl)){
				console.log(localUrl + " Already exists. Skipping download");
				finishedDownloads += 1;
				if (finishedDownloads == totalDownloads) resolve("Download Finished");
				continue;
			} 
			if (!fs.existsSync(localPath)) {
			  	mkdirp(localPath, function (err) {
					if (err) console.error(err); 
					else console.log('Directory created for ' + localPath);
				});
			}
			
			download(uri, localUrl, (err, output)=>{
				//console.log (`\x1b[42m \x1b[30m DOWNLOADED\x1b[0m ${media[i]}`);
				if (err) throw err;
			    if (output) console.log(output.join('\n'));
				finishedDownloads += 1;
				if (finishedDownloads == totalDownloads) resolve("Download Finished");
			});
			
		}
	});
}


//Calculates Homestuck.com style page number
function getPageNumber(s, p) {
	let sAlt, pAlt;
	switch(s){
		case "1":
			sAlt = "jailbreak";
			pAlt = (parseInt(p) - 1).toString();
			break;
		case "2":
			sAlt = "bard-quest";
			if (p == 136) pAlt = "1";
			else pAlt = (parseInt(p) - 169).toString();
			break;
		case "3":
			sAlt = "blood-spade";
			pAlt = "1";
			break;
		case "4":
			sAlt = "problem-sleuth";
			pAlt = (parseInt(p) - 218).toString();
			break;
		case "5":
			sAlt = "beta";
			pAlt = (parseInt(p) - 1892).toString();
			break;
		case "6":
			sAlt = "story";
			pAlt = (parseInt(p) - 1900).toString();
			break;
		case "ryanquest": 
			sAlt = s;
			pAlt = p;
			break;
	}
	return (sAlt + "/" + pAlt);
}


function filterMedia(media, page){
	media = media.split(/\r?\n/);
	for (var i = 0; i < media.length; i++){
		media[i] = media[i]
			.replace(/F\|(.*)\/([0-9]{5})/, "$1/$2/$2.swf") 			
			.replace(/S\|([^S]*)(?:\/Sfiles)?(\/(?:\d){5})/, "$1$2$2.gif")
			.replace(/(06276)\.gif/, "A6A6I1.swf")
			.replace(/(06379|06394|06398|06402|06413|07095|07122|07445|07921|07953)\.gif/, "$1.swf")
			.replace(/\/(0808[2-7])\.gif/, `heal.png`)
			.replace(/\/(080(8[89]|9[0-3]))\.gif/, `mspaint.png`)
			.replace(/\/(0809[4-9])\.gif/, `ah.png`)
			.replace(/\/(0810[0-4])\.gif/, `rings.png`)
			.replace(/\/(081(0[5-9]|10))\.gif/, `lilypad.png`)
			.replace(/\/(0811[1-9])\.gif/, `johndad.png`)
			.replace(/(08080|08120)\.gif/, "$1/$1.webm") //EOA6 & A7
			.replace(/(08123)\.swf/, "$1.webm")	//CREDITS
			.replace(/J\|(.*)/, "$1/Sburb.min.js")
			.replace(/(.*)(05260)/, '$1/levels/openbound/openbound.xml' )
			.replace(/(.*)(05305|05395)/, '$1/levels/init.xml' );
	}
	return media;
}


//Returns array:
//	[0]: Updated URL
//	[1]: Bool of whether the page is external
function matchExternalLink(url) {
	let isExternalPage = true;
	switch (url){
		case "http://www.katebeaton.com/Site/Welcome.html":
			url = "http://www.harkavagrant.com/";
			break;
		case "http://andrewhussie.com/whistlessite/preview.php?page=000.gif":
			url = "https://mrcheeze.github.io/andrewhussie/comic.html?comic=whistles";
			break;
		case "http://images.google.com/images?hl=en&amp;q=woodwind%20instruments":
			url = "https://www.google.com/search?q=woodwind+instruments&tbm=isch";
			break;
		case "http://www.topatoco.com/merchant.mvc?Screen=CTGY&amp;Store_Code=TO&amp;Category_Code=MSPA-ART":
			url = "https://topatoco.com/collections/mspa/art";
			break;
		case "http://images.google.com/images?hl=en&amp;q=beagle+puss&amp;btnG=Search+Images&amp;gbv=2&amp;aq=f&amp;oq=":
			url = "https://www.google.com/search?q=beagle+puss&tbm=isch";
			break;
		case "http://timelesschaos.com/":
			url = "https://twitter.com/gankro";
			break;
		case "http://images.google.com/images?um=1&amp;hl=en&amp;tbs=isch%3A1&amp;sa=1&amp;q=barbasol&amp;aq=f&amp;aqi=g1&amp;aql=&amp;oq=&amp;start=0&amp;social=false":
			url = "https://www.google.com/search?q=barbasol&tbm=isch";
			break;
		case "http://tinyurl.com/daveshirt":
			url = "https://topatoco.com/collections/mspa/products/mspa-record";
			break;
		case "http://www.adobe.com/products/photoshop/family/?promoid=BPDEK":
			url = "https://www.adobe.com/products/photoshopfamily.html";
			break;
		case "http://andrewhussie.blogspot.com/2009/01/need-for-steed.html":
			url = "https://wheals.github.io/blogspot/blogspot.html#need-for-steed";
			break;
		case "http://homestuck.bandcamp.com/":
			url = "https://homestuck.bandcamp.com/album/homestuck-vol-8";
			break;

		case "http://www.firmanproductions.com/":
			break
		case "http://en.wikipedia.org/wiki/Katamari_Damacy":
			break;
		case "http://en.wikipedia.org/wiki/Betty_Crocker":
			break;
		case "http://homestuck.bandcamp.com/album/colours-and-mayhem-universe-a":
			break;

		default:
			isExternalPage = false;
	}
	//Is page link
	if (/mspaintadventures\.com\/\?s=/.test(url)) isExternalPage = true;
	return [url, isExternalPage];
}


function convertPostlinkToDownloadableLink(url) {
	switch(url){
		case "https://www.youtube.com/watch?v=6dDBAiq4RFE":
			url = "./app-content/bunny.mp4"
			break;
		case "http://www.youtube.com/watch?v=AW3aCuxY1DY":
		case "http://tinyurl.com/hullohumminburr":
			url = "./app-content/howdoilive.mp4";
			break;

		case "http://www.youtube.com/watch?v=taRyHE0al7Y":
			url = "./app-content/rufio.mp4";
			break;

		case "http://www.youtube.com/watch?v=QbsXLDNPvNc":
			url = "./app-content/midnightcrew.mp4";
			break;

		case "http://tinyurl.com/MoThErFuCkInMiRaClEs":
			url = "./app-content/miracles.mp4";
			break;

		case "http://www.blackfives.com/blog_pics/carnegie_study.jpg":
		 	url = "./app-content/carnegie_study.jpg";
		 	break;

		case "http://img.photobucket.com/albums/v296/Tenebrais/MSPA/Incipisphere-5.png":
			url ="./app-content/Incipisphere-5.png"
			break;
		 case "http://bit.ly/d7kXrQ":
		 	url = "http://www.mspaintadventures.com/storyfiles/hs2/dreambotlog/davesmeteor.jpg"
		 	break;
	}

	let scraps = "storyfiles/hs2/scraps/";
	if (/tinyurl\.com/.test(url)){
		url	.replace(/tinyurl\.com/, "www.mspaintadventures.com")
			.replace("sprite", "01.jpg")
			.replace("power", "02.jpg")
			.replace("internet", "03.jpg")
			.replace("build", "04.jpg")
			.replace("prototype", "05.jpg")
			.replace("disconnect", "06.jpg")
			.replace("nanna", "07.jpg")
			.replace("weirdo", "08.jpg")
			.replace("designix", "09.jpg")
			.replace("grist", "10.jpg")
			.replace("up", "11.jpg")
			.replace("steed", "12.jpg")
			.replace("barbasolbandit", "13.jpg")
			.replace("really", "14.jpg")
			.replace("hmm", "15.jpg")
			.replace(/(0413|O4130)/, "storyfiles/hs2/walkthrough/screencaps/")
			.replace(`1STH1SYOUD4V3`, `${scraps}humancaptainplanet.jpg`)
			.replace(`1T1SYOU1SNT1T`, `${scraps}humancaptainplanetisdave!.jpg`)
			.replace(`PUR3D4V3`, `${scraps}humanchildisdave.jpg`)
			.replace(`TH1S1SSOOOOD4V3`, `${scraps}kidstrider!!!.jpg`)
			.replace(`D4V34NDBRO43V3R`, `${scraps}pinballbros.jpg`)
			.replace(`T34CHM3D4V3`, `${scraps}T34CHM3TH31NT3RN3TD4V3.jpg`)
			.replace(`ohy34h`, `${scraps}ohy34h.jpg`)
			.replace(`CDandSL`, `${scraps}cooldudeandstonerlou.gif`)
			.replace(`FORB3NST1LL3R`, `${scraps}FORB3NST1LL3R.jpg`)
			.replace(`SPOTONSTR1D3R`, `${scraps}SPOTONSTR1D3R.jpg`)
			.replace(`OMGD4NC3P4RTY`, `${scraps}D4NC3P4RTYON3.gif`)
			.replace(`T34CHM3YOURMOV3SD4V3`, `${scraps}D4NC3P4RTYTWO.gif`)
			.replace(`TH3FLO4R-1SONF1R3`, `${scraps}D4NC3P4RTYTHR33.gif`)
			.replace(`H3LLFUCK1NGY3S`, `${scraps}D4NC3P4RTYFOUR.gif`)
			.replace(`MATINGDIAGRAMFORMORONS`, `${scraps}MATINGDIAGRAMFORMORONS.gif`)
			.replace(`D4V3XD4V3`, `${scraps}D4V3XD4V3.jpg`)
			.replace(`dirkisthisyoU`, `${scraps}dirkisthisyoU.gif`)
			.replace(`DIRKTHISISuS`, `${scraps}DIRKTHISISuS.gif`)
			.replace(`roxyisthisyoU`, `${scraps}roxyisthisyoU.gif`)
			.replace(`JANETHISISYOU`, `${scraps}JANETHISISYOU.gif`)
			.replace(`JAKETHISISUS`, `${scraps}JAKETHISISUS.gif`)
	}
	else if (/goo\.gl/.test(url)){
		url	.replace(/goo\.gl/, "www.mspaintadventures.com")
			.replace(`BPSnY`, `${scraps}smuut1.gif`)
			.replace(`cTQZ6`, `${scraps}smuut2.gif`)
			.replace(`WQ0CU`, `${scraps}smuut3.gif`)
			.replace(`lvLpU`, `${scraps}smuut4.gif`)
			.replace(`rgfyW`, `${scraps}smuut5.gif`)
			.replace(`s0ILH`, `${scraps}smuut6.gif`)
			.replace(`58e9O`, `${scraps}smuut7.gif`)
			.replace(`mSTQk`, `${scraps}smuut8.gif`)
			.replace(`GD2nO`, `${scraps}smuut9.gif`)
			.replace(`FIYFS`, `${scraps}smuut10.gif`)
			.replace(`i2O11`, `${scraps}smuut11.gif`)
			.replace(`itJga`, `${scraps}smuut12.gif`)
			.replace(`HmRpl`, `${scraps}smuut13.gif`)
			.replace(`WrdJG`, `${scraps}smuut14.gif`)
			.replace(`Ay8mv`, `${scraps}smuut15.gif`)
			.replace(`1Ha6R`, `${scraps}smuut16.gif`)
			.replace(`GLNHH`, `${scraps}smuut17.gif`)
			.replace(`XE2fl`, `${scraps}smuut18.gif`)
			.replace(`2HsXl`, `${scraps}smuut19.gif`)
			.replace(`vvYxn`, `${scraps}smuut20.gif`)
			.replace(`vsGuq`, `${scraps}smuut21.gif`)
			.replace(`v33Yj`, `${scraps}smuut22.gif`)
			.replace(`ObEuT`, `${scraps}smuut23.gif`)
			.replace(`gz1iH`, `${scraps}smuut24.gif`)
			.replace(`zJgPI`, `${scraps}smuut25.gif`)
			.replace(`8WOPP`, `${scraps}smuut26.gif`)
	}

	if (/\/waywardvagabond\//.test(url)){
		url = checkforWaywardPages(url);
	}

	return url;
}

function checkforWaywardPages(url){
	var vagabondImages = [];
	var vagabondId = url.match(/(?<=waywardvagabond\/)[A-Za-z]*/)[0];
	var root = "http://www.mspaintadventures.com/storyfiles/hs2/waywardvagabond/"
	var max = 0;
	switch(vagabondId){		
		case "recordsastutteringstep":
		case "astudiouseye":
			max =  6;
			break;
		case "windsdownsideways":
		case "anunsealedtunnel":
			max =  7;
			break;
		case "anagitatedfinger":
			max =  4;
			break;
		case "beneaththegleam":
			max =  2;
			break;
		case "asentrywakens":
			max =  5;
			break;
		case "preparesforcompany":
			max =  1;
			break;
	}
	vagabondImages.push(`${root}${vagabondId}/index.html`)
	for (let i = 1; i <= max; i++) vagabondImages.push(`${root}${vagabondId}/0${i}.gif`);
	return vagabondImages;
}

function weaveArrays(array1, array2){
	result = [];
	i = j = k = 0;
	while (i < array1.length && j < array2.length){
		result[k++] = array1[i++];
		result[k++] = array2[j++];
	}
	while (i < array1.length){
		result[k++] = array1[i++];
	}
	while (j < array2.length){
		result[k++] = array2[j++];
	}
	return result.join("");
}

function filterPostlinks(html) {
	let postlinks = html.match(/<(?:img|a).*?>/g);
	let htmlSplit = html.split(/<(?:img|a).*?>/);
	let downloads = [];

	if (postlinks !== null){
		for (let i = 0; i < postlinks.length; i++){
			let link =  postlinks[i].match(/(?<=src="|href=").+?(?=")/)[0];
			let externalResult = matchExternalLink(link);
			link = externalResult[0];
			let isExternalPage = externalResult[1];
			if (!isExternalPage){
				link = convertPostlinkToDownloadableLink(link);
				downloads = downloads.concat(link); 
			}

			postlinks[i] = postlinks[i].replace(/(?<=src="|href=").+?(?=")/, link);
		}

		html = weaveArrays(htmlSplit, postlinks);
	}

	return [html, downloads];
}

function assembleHtml(title, text, media, pageId) {
	var html = "";
	var page = pageId.split("/")[1];

	html+= `<section class="page" id="${pageId}">`;

	html += `<h1 class="page-title">${ title }</h1>`;

	media.forEach( (url) =>{
		let localPath = url.replace(/^(.*?)\.com/, ".");
		let mediaNumber = localPath.slice(localPath.lastIndexOf("/")+1, localPath.lastIndexOf("."))
		if (/\.swf/.test(localPath)){
			html += flashTemplate(localPath);
		}
		//OPENBOUND USES IFRAMES TO DISPLAY CONTENT
		else if (page == "007163" || page == "007208" || page == "007298" ){			
			localPath = localPath.replace(/Sburb\.min\.js/, `${mediaNumber}.html`);
			html += `<iframe id="inlineSburb" title="Openbound" width="650" height="450" src="${ localPath }" scrolling="no"></iframe>`;
		}
		else if (/(\.webm|\.mp4)/.test(localPath)){ 
			html += `<video controls autoplay id="${mediaNumber}"><source src="${ localPath }" type="video/${ localPath.match(/(webm|mp4)/)[0] }"></video>`;
		}
		else {
			html += `<img class="pic" id="${ localPath.slice(localPath.lastIndexOf("/")) }" src="${ localPath }" alt="" />`;
		}
	});


	//PAGE IS A LOG
	if (/\|.*?\|/.test(text)){
		let beforeLog = text.match(/.*(?=\|.*?\|)/)[0];
		let afterLog = text.replace(beforeLog, "");
		html += (
				`<div class="beforeLog">${ beforeLog }</div>` +
				`<div class="log hidden">`+
				`<button type="button" onclick="loggle();">${ afterLog.match(/(?<=\|)(.*?)(?=\|)/)[0].toLowerCase() }</button>`+
				`<section id="logContent">${ afterLog.replace(/\|.*?\|(\r?\n)/, "") }</section>`+
				`</div>`);
	}
	//PAGE IS REGULAR TEXT
	else{
		html += `<div class="text">${ text }</div>`;
	}

	html+= `</section>`;
	
	html = html.replace(/(\r?\n)/gm, "<br />")
				.replace('trkstrlog', "tricksterlog")
				.replace(/http\:\/\/(www|cdn)\.mspaintadventures\.com/g, ".")
				.replace(/\/advimgs\//gm, "/storyfiles/")
				.replace(/\/ryanquest\//gm, "/storyfiles/ryanquest/");
	return html;
}

//Tries not to overwrite pre-existing object
function addObjectToData(object, s, p){
	if (p in data[s]){
		Object.assign(data[s][p], object);
	}
	else {
		data[s][p] = object;
	}
}

function unretcon(media) {
	for (var i = 0; i < media.length; i++){
		//UNRETCON EVERYTHING
		if (/1([0-9]{4})/.test(media[i]) || /[0-9]{5}(_?retcon(?:heir)?)/.test(media[i]) ){
			let unretconned = media[i]
				.replace(/1([0-9]{4})/, "0$1")
				.replace(/([0-9]{5})_?retcon(?:heir)?/, "$1");
			media.push(unretconned);

			console.log(`${media[i].slice(media[i].lastIndexOf("/"))}\x1b[35m ->UNRETCONNED\x1b[0m`);
		}
		else if (/PEACHY/.test(media[i])){
			media.push("http://www.mspaintadventures.com/storyfiles/hs2/05720_2.gif");
			media.push("http://www.mspaintadventures.com/storyfiles/hs2/scraps/CAUCASIAN.gif");
			console.log(`${media[i].slice(media[i].lastIndexOf("/"))}\x1b[35m ->UNPEACHY'D\x1b[0m`);
		}
	}
	return media;
}

//PageId will always be within 5664-5981
function getScratchBanner(page){
	let bannerNumber = hoverText = LEnumber = "";
	let mspa = "http://www.mspaintadventures.com/storyfiles/hs2/";
	let num = parseInt(page);
	let hussText = [
		"BOOYEAH",
		"... the FUCK?",
		"Oh hell no. He's talking about ancestors, isn't he.",
		"He's keeping little girls locked up in weird rooms, and rambling about troll ancestors. I just know it.",
		"NOT IN MY FUCKING COMIC.",
		"Oh, damn. This place is bigger than I thought. Any idea which way he went? Come on guys, help me out.",
		"I bet he's behind this door. YOU HEAR ME SCRATCH, THE JIG IS UP.",
		"Ah-ha! Caught red handed, you bastard. You stop clogging up my story with your troll fanfiction this instaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH",
		"That was not the right door.",
		"This looks like the right place. The hallway is all round and shit. Just like his big stupid head.",
		"MY BEAUTIFUL PANELS WHAT HAS HE DONE. That son of a bitch. It's is going to take so many sweeps to clean this mess up. So very, very many sweeps.",
		"God dammit, he's got a bowl full of these things?? He's pulling his snooty horseshit candy bowl stunts to mock my little arrows now. Excellent host my ass.",
		"RAAARARRAAUUUAAAAUUAGHGHGGHGGGGHHGH! *flip*",
		"Oh my god how can these possibly be so delicious???",
		"Whoa, better go easy on these. Might need some later.",
		"There you are. Go ahead, keep talking cueball. I've got you in the crosshairs of my broombristles. I have GOT you you pompous motherfucker.",
		"Tick. Tock. Tick. Tock. Tick. Tock. My heartbeat falls in rhythm with the clock as I draw close to my prey. I leave nothing to chance, for you see it is the most dangerous prey of all, a four foot tall asshole in suspenders who won't shut up. Wait for it, Hussie. Wait for it...",
		"RAAARARRAAUUUAAAAUUAGHGHGGHGGGGHHGH! *trip*",
		"bap bap bap bap bap bap bap bap bap bap bap bap bap bap bap bap bap bap bap bap bap bap bap",
		"Everybody is totally fed up with your condescending, self indulgent narrative style. They all want to go back to my slightly less condescending, slightly more self indulgent style.",
	];

	if (num >= 5952){
		bannerNumber = 117 - (5981 - num);

		if (bannerNumber >= 112){
			LEnumber = bannerNumber - 111;
		}
		else if (bannerNumber >= 92){
			let hussNumber = 19 - ( 111 - bannerNumber);
			hoverText = ` title="${hussText[hussNumber]}"`;
		}
	}
	else if (num >= 5937){
		bannerNumber = 87;
	}
	else if (num == 5936){
		bannerNumber = 86
	}
	else if (num >= 5903){
		bannerNumber = 85;
	}
	else if (num == 5902){
		bannerNumber = 84;
	}
	else if (num == 5874){
		bannerNumber = 83;
	}
	else if (num == 5836){
		bannerNumber = 82;
	}
	else if (num == 5795){
		bannerNumber = 81;
	}
	else if (num >= 5775){
		bannerNumber = 80;
	}
	else if (num >= 5697){
		bannerNumber = (79 - (5774 - num)).toString().padStart(2, "0");
	}

	result = `<img class="scratchBanner" src="${mspa}scratch/room${bannerNumber}.gif" ${hoverText}alt="">`;
	if (num >= 5976)
		result += `<img class="scratchBanner-imgtooltip" src="${mspa}scraps/LEtext${ LEnumber }.gif" alt=""><script src="./plugins/ddimgtooltips.js"></script>`;
	return result;

}

async function processPage(rawPage, pageId, statusCode){
	if (statusCode == 200){	

		let story = pageId.split("/")[0];
		let page = pageId.split("/")[1];
		let pageNumber = getPageNumber(story, page);

		/*	Get parts from raw page	
			[0]: Title
			[1]: Forum ID (Useless)
			[2]: Timestamp
			[3]: Media
			[4]: Text
			[5]: Next Page
		*/
		parts = rawPage.split("###");
		for (var i = 0; i < parts.length; i++){
			parts[i] = parts[i].trim();
		};

		let textContent = parts[4];
		if (parseInt(page) >= 5664 && parseInt(page) <= 5981) {
			textContent = getScratchBanner(page) + textContent;
		}
		let filteredPostlinks = filterPostlinks(textContent);
		textContent = filteredPostlinks[0];

		let media = filterMedia(parts[3], page);
		let toDownload = media.concat(filteredPostlinks[1]);

		let htmlContent = assembleHtml(parts[0], textContent, media, pageId);

		//Gets array of next page IDs
		let nextId = parts[5].split(/\r?\n/);
		nextId.pop(); //GETS RID OF EOF CHARACTER X

		nextId.forEach((id) =>{
			let nextPageObject = {previous: page}
			addObjectToData(nextPageObject, story, id);
			//TODO: Character Selection Exceptions??
		});

		//Page object is assembled
		pageObject = {
			title: parts[0],
			pageId: pageId,
			pageNumber: pageNumber,
			timestamp: parts[2],
			content: htmlContent,
			next: nextId,
		};
		addObjectToData(pageObject, story, page)
		
		console.log(`${pageId}\x1b[36m -> PAGE OBJECT GENERATED\x1b[0m`);
		toDownload = unretcon(toDownload);
		console.log(toDownload);
		console.log(`${pageId}\x1b[31m --> DOWNLOADING MEDIA\x1b[0m`);
		await downloadMedia(toDownload);
	}
	else if (statusCode == 404){
		//Skip page
		console.log(`${pageId}\x1b[33m-> 404, SKIPPING PAGE\x1b[0m`);
	}

	workerCount -= 1;
	pagesReturned += 1;
	console.log (`${pageId}\x1b[32m ----> COMPLETED\x1b[0m (${pagesReturned}/${totalPages})`);
	scrape(); //It's recursive motherfucker
}

//@pageId = "Y/0XXXXX"
async function deployWorker(pageId){
	workerCount += 1;

	url = `http://www.mspaintadventures.com/${ pageId }.txt`;
	request(url, (error, response, html) => {
		if ((!error && response.statusCode == 200) || response.statusCode == 404){
			processPage(html, pageId, response.statusCode);
		}
		else{
			console.log('\x1b[33m' + response.statusCode +": URL (" + url + ") is not valid." + '\x1b[0m');
			process.exit();
		}
	})

	await sleep(150);
}


function mapPageNumber(pageNumber){
	/*
	s=1.) Jailbreak p=(000002-000135 + jb2_000000)
		000001 & 000007 are missing
		Finishes on unique number 

	s=2.) Bard Quest p=(000136 + 000171-000216)
		Starts on 000136, then skips to 000171

	s=3.) Blood Spade p=(MC0001)
		Presumably replaces 000217 or 000218

	s=4.) Problem Sleuth p=(000219-001892)
		000992 is missing

	s=5.) Homestuck Beta p=(001893-1900)

	s=6.) Homestuck p=(001901-010030)

		004299, 004938, 004988 are missing
		008270 is a direct clone of 008269

		pony is linked from 002838
		pony2 is linked from 006517

		darkcage exists, but is not linked
		darkcage 2 is linked from 006927
		
		006715 redirects to DOTA
		008801 redirects to GAME OVER
		009305 redirects to shes8ack
		009987 redirects to Collide
		010027 redirects to Act 7
		010030 redirects to endcredits

	s=ryanquest.) Ryanquest p=(000001-0000015)
	*/
	
	let s;
	//JAILBREAK
	if (pageNumber <= 135 && pageNumber >= 2){
		s = "1";
		//Take advantage of missing page to grab final page
		if (pageNumber == "7"){
			return (s + "/jb2_000000");
		}
	}

	//BARDS QUEST
	else if (pageNumber == 136 || (pageNumber >= 171 && pageNumber <= 216)) {
		s = "2";
	}

	//RYANQUEST
	else if (pageNumber <= 151 && pageNumber >= 137) {
		s = "ryanquest";
		p = pageNumber - 136;
		return  (s + "/" + p.toString().padStart(6, "0"));
	}

	//BLOOD SPADE + HOMESTUCK EXTRAS
	else if (pageNumber <= 156 && pageNumber >= 152){
		switch (pageNumber){
			case 152:
				return ("3/MC0001");
			case 153:
				return ("6/pony");
			case 154:
				return ("6/pony2");
			case 155:
				return ("6/darkcage");
			case 156:
				return ("6/darkcage2");
		}
	}

	//PROBLEM SLEUTH
	else if (pageNumber <= 1892 && pageNumber >= 219 && !(pageNumber == 992)){
		s = "4";
	}

	//HOMESTUCK BETA
	else if (pageNumber <= 1900 && pageNumber >= 1893){
		s = "5";
	}

	//HOMESTUCK
	else if (pageNumber <= 10030 && pageNumber >= 1901 && !(pageNumber == 4299 || pageNumber == 4938 || pageNumber == 4988)){
		s = "6";
	}

	if (s) return  (s + "/" + pageNumber.toString().padStart(6, "0"));
	else return "0";

}

function scrape(){
	if ((pagesRequested < totalPages) && (currentPage() <= endPage) && currentPage() <= 10030 ){
		while ((workerCount < workerMax) && (pagesRequested < totalPages)){
			let p = mapPageNumber(currentPage());
			pagesRequested++;
			deployWorker(p);
		}
	}
	else if (pagesReturned == totalPages){
		console.log("Task complete.");
		let json = JSON.stringify(data);
		fs.writeFile('../story.json', json, 'utf8', () =>{
			console.log("JSON Saved.");
			process.exit();
		});
	}
}

function initialize(){
	data = {
		"1": {},
		"2": {},
		"3": {},
		"4": {},
		"5": {},
		"6": {},
		"ryanquest": {},
	}

	//begin process
	let hasffmpeg = ffb.locateBinariesSync(['ffmpeg'], { paths: "./", ensureExecutable: true }).ffmpeg.found;
	if (!hasffmpeg){
		console.log('Downloading ffmpeg.');
		ffb.downloadBinaries(['ffmpeg'], {}, function () {
			console.log('Downloaded ffmpeg. starting scraper');
			scrape();
		});
	}
	else{
		console.log('ffmpeg already exists. starting scraper');
		scrape();
	}
}

initialize();