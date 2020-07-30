const fs = require('fs');
const mkdirp = require('mkdirp');
const {JSDOM} = require('jsdom');
const got = require("got");
const stream = require('stream');
const pipeline = require('util').promisify(stream.pipeline);
const iconv = require('iconv-lite');

//const ytdl = require('youtube-dl');
//var ffb = require('ffbinaries');

var data;
const dataOptions = new Set([
	"jb",
	"bq",
	"ps",
	"beta",
	"hs1",
	"hs2",
	"hs3",
	"hs4",
	"rq",
	"logs",
	"psExtras",
	"wv",
	"sbahj",
	"extraMedia",
	// "custom"
])

var pages, pagesCompleted, totalPages;

const workerMax = 100;
var workerCount = 0;

var outputDir = "D:/My Files (HDD)/mspaoutput";


function lastSecondExceptions(uri){

	return uri
			.replace( 'darkcage.swf', 'kcage.swf' )
			.replace( 'darkcage2.swf', 'cage2.swf' )
			.replace( /storyfiles\/hs2\/04812/, "DOTA")
			.replace( /storyfiles\/hs2\/05492/, "007395")
			.replace( /storyfiles\/hs2\/05777/, "007680")
			.replace( /storyfiles\/hs2\/06898/, "GAMEOVER")
			.replace( /storyfiles\/hs2\/07402/, "shes8ack")
			.replace( '06276.swf', 'A6A6I1.swf' )

			// .replace( /.*bunny\.mp4/, "https://vimeo.com/343697526" ) //Bunny 001920
			// .replace( /.*howdoilive\.mp4/, "https://vimeo.com/343699455" ) //How do I live 004572
			// .replace( /.*miracles\.mp4/, "https://vimeo.com/343702481" ) //Miracles 004718
			// .replace( /.*rufio\.mp4/, "https://vimeo.com/343697335" ) //Rufio 005286
			// .replace( /.*midnightcrew\.mp4/, "https://vimeo.com/343693205" ) //Midnight Crew 005627

			// .replace( /.*08080\.webm/, "https://www.youtube.com/watch?v=Y5wYN6rB_Rg") //EOA6
			// .replace( /.*08120\.webm/, "https://www.youtube.com/watch?v=FevMNMwvdPw") //A7
			// .replace( /.*08123\.webm/, "https://www.youtube.com/watch?v=rMZU89jY2j8") //Credits
}

async function download (uri, filename){
	let result = false;
	if (/mspaintadventures\.com/.test(uri)){
		let remainingTries = 3;
		let cdnToggleAttempted = false;
		do {
			try {
				const response = await got(uri);
				if ( response.statusCode == 200 ) {
					console.log(`${filename.slice(filename.lastIndexOf("/"))} \x1b[33m---> LOCATED MEDIA\x1b[0m`);
					await pipeline(got.stream(uri), fs.createWriteStream(filename));
					result = true;
					remainingTries = 0;
				}
			} catch (error) {
				console.log(error)
				if (error.response && error.response.statusCode == "404") {
					if (!cdnToggleAttempted) {
						console.log(`${error.response.statusCode} "${uri}" not found on CDN. Switching to main server.`);
						uri = uri.replace(/cdn(\.mspa)/, "www$1")
						cdnToggleAttempted = true;
					}
					else {
						console.log(`${error.response.statusCode} "${uri}" not found. Skipping.`);
						remainingTries = 0;
					}
				}
				if (error.response && error.response.statusCode == "400") {
					console.log(`${error.response.statusCode} "${uri}" was invalid. Trying ${remainingTries} more time(s).`);			
					remainingTries--;
					if (remainingTries <= 0) {						
						console.log(`${uri} \x1b[33m---> FAILED TO DOWNLOAD MULTIPLE TIMES. SKIPPING.\x1b[0m`);
					}
					
				}
				else {
					console.log(`${error} Something went wrong downloading "${uri}" Trying ${remainingTries} more time(s).`);
					remainingTries--;
					if (remainingTries <= 0) {						
						console.log(`${uri} \x1b[33m---> FAILED TO DOWNLOAD MULTIPLE TIMES. SKIPPING.\x1b[0m`);
					}
				}
			}
		} while (remainingTries > 0);
	}
	// else if (/youtube/.test(uri)){
	// 	ytdl.exec(uri, ['-f', 'bestvideo[ext=webm]+bestaudio[ext=webm]/best', `--output=${filename}`], {}, callback); //.%(ext)s
	// }
	// else if (/vimeo/.test(uri)){
	// 	ytdl.exec(uri, ['-f', 'bestvideo[ext=mp4]+bestaudio[ext=mp4]/best', '--video-password', 'homestuck', `--output=${filename}`], {}, callback); //.%(ext)s
	// }
	else {
		console.log(`${uri} \x1b[33m---> Has a non-MSPA domain. Not downloading that.\x1b[0m`);
	}
	return result;
};

//Media is array of links to images/flashes
async function downloadMedia(media){
	console.log("No downloading this time")
	return 

	if (!Array.isArray(media))
		media = [media];
	
	let finishedDownloads = 0;
	let totalDownloads = media.length;

	for (var i = 0; i < totalDownloads; i++){
		media[i] = media[i].replace(/www(\.mspa)/, "cdn$1");
		localUrl = media[i].replace(/^(.*?)\.com/, `${outputDir}`);

		localPath = localUrl.slice(0, localUrl.lastIndexOf("/"));

		uri = lastSecondExceptions(media[i]);

		if (!/mspaintadventures|youtube|vimeo/.test(uri)){
			console.log(`${localUrl.slice(localUrl.lastIndexOf("/"))} \x1b[33m---> Has an unrecognised domain. Not downloading that.\x1b[0m`);
			finishedDownloads += 1;
			if (finishedDownloads == totalDownloads) return;
			continue;
		}

		if (fs.existsSync(localUrl) && fs.statSync(localUrl)['size'] > 0){
			console.log(localUrl + " Already exists. Skipping download");
			finishedDownloads += 1;
			if (finishedDownloads == totalDownloads) return;
			continue;
		} 

		if (!fs.existsSync(localPath)) {
				mkdirp.sync(localPath, function (err) {
				if (err) console.error(err); 
				else console.log('Directory created for ' + localPath);
			});
		}

		let result = await download(uri, localUrl);
		if (result){
			console.log (`\x1b[42m \x1b[30m DOWNLOADED\x1b[0m ${media[i]}`);
			finishedDownloads += 1;
			if (finishedDownloads == totalDownloads) return;
		}
		
	}
}

async function filterMedia(media, page){
	media = media.split(/\r?\n/);
	for (var i = 0; i < media.length; i++){
		
		media[i] = media[i]
			.replace(/F\|(.*)\/(\w*)$/, "$1/$2/$2.swf") 	
			.replace(/J\|(.*)\/(\w*)$/, "$1/$2/$2.html")		
			.replace(/(04106|05777|06898|07402)(?:\.gif)?/, "$1/$1.swf") // (CROWBAR 1, 2, GAME OVER, shes8ack)

			.replace(/(08080|08120)\.gif/, "$1/$1.mp4") //EOA6 & A7
			.replace(/(08123)\.swf/, "$1.mp4")	//CREDITS

			if (/^S\|/.test(media[i])) {
				await (async () => {
					try {	
						var response = await got(media[i].replace(/^S\|/, ""));
						var dom = new JSDOM(response.body)
						let url = dom.window.document.getElementsByTagName('img')[0];
						if (url) {
							url = url.src	
						} else {
							url = dom.window.document.getElementsByName('movie')[0].value;
						}
						dom.window.close();

						media[i] = url;
					}
					catch (error) {
						console.log(error + "Sfiles fuckin cockblocked us")
						process.exit();
					}
				})();
			}
	}
	return media;
}

function filterPostlink(url) {
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
			url = "https://twitter.com/Gankra_";
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
			url = "https://homestuck.bandcamp.com/album/homestuck-vol-7-8-with-cherubim";
			break;
		case "http://homestuck.bandcamp.com/album/colours-and-mayhem-universe-a":
			url = "http://homestuck.bandcamp.com/album/colours-and-mayhem-universe-a-b";
			break;

		case "http://www.firmanproductions.com/":
			break
		case "http://en.wikipedia.org/wiki/Katamari_Damacy":
			break;
		case "http://en.wikipedia.org/wiki/Betty_Crocker":
			break;

		case "https://www.youtube.com/watch?v=6dDBAiq4RFE":
			url = "external/vid/bunny.mp4"
			break;
		case "http://www.youtube.com/watch?v=AW3aCuxY1DY":
		case "http://tinyurl.com/hullohumminburr":
			url = "external/vid/howdoilive.mp4";
			break;

		case "http://www.youtube.com/watch?v=taRyHE0al7Y":
			url = "external/vid/rufio.mp4";
			break;

		case "http://www.youtube.com/watch?v=QbsXLDNPvNc":
			url = "external/vid/midnightcrew.mp4";
			break;

		case "http://tinyurl.com/MoThErFuCkInMiRaClEs":
			url = "external/vid/miracles.mp4";
			break;

		case "http://www.blackfives.com/blog_pics/carnegie_study.jpg":
		 	url = "external/img/carnegie_study.jpg";
		 	break;

		case "http://img.photobucket.com/albums/v296/Tenebrais/MSPA/Incipisphere-5.png":
			url ="external/img/Incipisphere-5.png"
			break;
		 case "http://bit.ly/d7kXrQ":
		 	url = "http://www.mspaintadventures.com/storyfiles/hs2/dreambotlog/davesmeteor.jpg"
		 	break;
	}

	let scraps = "storyfiles/hs2/scraps/";
	if (/tinyurl\.com/.test(url)){
		url = url	
			.replace(/tinyurl\.com/, "www.mspaintadventures.com")
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
		url = url
			.replace(/goo\.gl/, "www.mspaintadventures.com")
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

	return url;
}

//PageId will always be within 5664-5981
function getScratchBanner(page){
	let bannerNumber = "";
	let num = parseInt(page);

	console.log(`${page}, ${num}`)


	if (num >= 5952){
		bannerNumber = 117 - (5981 - num);
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

	return `http://www.mspaintadventures.com/storyfiles/hs2/scratch/room${bannerNumber}.gif`;

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

function filterHtml(html) {
	let postlinks = html.match(/<(?:img|a).*?>/g);
	let htmlSplit = html.split(/<(?:img|a).*?>/);
	let downloads = [];

	if (postlinks !== null){
		for (let i = 0; i < postlinks.length; i++){
			let link =  postlinks[i].match(/(?<=src="|href=").+?(?=")/)[0];	
			link = filterPostlink(link);
			let doDownload = (
				!!link.match(/\.(txt|gif|jpg|png|swf|mp3|wav)$/i)
				&& !(/(sweetbroandhellajeff|carnegie_study|Incipisphere-5)/.test(link))
			)
			if (doDownload) downloads = downloads.concat(link);			

			postlinks[i] = postlinks[i].replace(/(?<=src="|href=").+?(?=")/, link);
		}

		html = weaveArrays(htmlSplit, postlinks);
	}

	html = html.replace(/(\r?\n)/gm, "<br />")
				.replace('trkstrlog', "tricksterlog")
				.replace('sriousbiz', 'serious business')
				// .replace(/http\:\/\/(www|cdn)\.mspaintadventures\.com/g, ".")

	return [html, downloads];
}

//Tries not to overwrite pre-existing object
function setPageObj(storyObj, pageId, pageObj){
	storyObj[pageId] = storyObj[pageId] || {};

	storyObj[pageId] = {
		...pageObj,
		...storyObj[pageId]
	}
}

function unretcon(media) {
	for (var i = 0; i < media.length; i++){
		//UNRETCON EVERYTHING
		if (/1([0-9]{4})/.test(media[i]) || /(_?retcon(?:heir)?)/.test(media[i]) ){
			let unretconned = media[i]
				.replace(/1([0-9]{4})/g, "0$1")
				.replace(/_?(?:preemptive)?retcon(?:heir)?/, "");
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

async function getExtraMediaUrls() {
	let siteImages = [
		"images/trickster_sitegraphics/bannerframe2.gif",
		"images/trickster_sitegraphics/bluetile.gif",
		"images/trickster_sitegraphics/menu.swf",
		"images/trickster_sitegraphics/sucker.gif",
		"images/trickster_sitegraphics/Z2.gif",
		"images/a6a6_bannerframe.png",
		"images/a6a6_latestpages.png",
		"images/a6a6_news.png",
		"images/a6a6_sponsors.png",
		"images/a6a6_tooth2.gif",
		"images/act6act5act1x2arrows.gif",
		"images/act6act5act1x2combo.gif",
		"images/act7_header.gif",
		"images/archive_bq.gif",
		"images/archive_hs.gif",
		"images/archive_jb.gif",
		"images/archive_ps.gif",
		"images/bannerframe.png",
		"images/bannerframeX2.png",
		"images/candycorn.gif",
		"images/candycorn_scratch.png",
		"images/collide_header.gif",
		"images/header_cascade.gif",
		"images/logo.gif",
		"images/mspalogo_sbahj.jpg",
		"images/newreaders_sig.gif",
		"images/news.png",
		"images/science_faq_pimass.gif",
		"images/science_faq_timedilation.gif",
		"images/search_sleuth.gif",
		"images/swampwizard.gif",
		"images/title.png",
		"images/unlock_codemachine.gif",
		"images/unlock_gamecode.gif",
		"images/v2_biglogo.gif",
		"images/v2_mspalogo.gif",
		"images/v2_mspalogo_scratch.gif",
		"images/yeflask.gif"
	]

	let desktopImages = [
		"desktops/craterblastoff_1280x1024.jpg",
		"desktops/craterblastoff_1440x900.jpg",
		"desktops/craterblastoff_1920x1080.jpg",
		"desktops/craterblastoff_thumb.jpg",
		"desktops/craterdesert_1280x1024.jpg",
		"desktops/craterdesert_1440x900.jpg",
		"desktops/craterdesert_1920x1080.jpg",
		"desktops/craterdesert_thumb.jpg",
		"desktops/craterisland_1280x1024.jpg",
		"desktops/craterisland_1440x900.jpg",
		"desktops/craterisland_1920x1080.jpg",
		"desktops/craterisland_thumb.jpg",
		"desktops/daveapt_1280x1024.jpg",
		"desktops/daveapt_1440x900.jpg",
		"desktops/daveapt_1920x1080.jpg",
		"desktops/daveapt_thumb.jpg",
		"desktops/endpose_1440x900.jpg",
		"desktops/endpose_1920x1080.jpg",
		"desktops/jadehouse_1280x1024.jpg",
		"desktops/jadehouse_1440x900.jpg",
		"desktops/jadehouse_1920x1080.jpg",
		"desktops/jadehouse_thumb.jpg",
		"desktops/johnhouse_1280x1024.jpg",
		"desktops/johnhouse_1440x900.jpg",
		"desktops/johnhouse_1920x1080.jpg",
		"desktops/johnhouse_thumb.jpg",
		"desktops/mcwpp_1280x1024.jpg",
		"desktops/mcwpp_1440x900.jpg",
		"desktops/mcwpp_1920x1080.jpg",
		"desktops/mcwpp_thumb.jpg",
		"desktops/office_1440x900.jpg",
		"desktops/office_1920x1080.jpg",
		"desktops/PS_endpose_desktop.jpg",
		"desktops/PS_endpose_desktop_thumb.jpg",
		"desktops/PS_office_desktop.jpg",
		"desktops/PS_office_desktop_thumb.jpg",
		"desktops/skaia_1280x1024.jpg",
		"desktops/skaia_1440x900.jpg",
		"desktops/skaia_1920x1080.jpg",
		"desktops/skaia_thumb.jpg",
	]

	let scraps = [
		"firefly_sprite_opt.png",
		"firefly_sprite_left_opt.png",
		"extras/PS_titlescreen/PS_titlescreen.swf",
		"storyfiles/hs2/echidna/echidna.swf",
		"storyfiles/hs2/scraps/calliope.gif",
		"storyfiles/hs2/scraps/LEtext1.gif",
		"storyfiles/hs2/scraps/LEtext2.gif",
		"storyfiles/hs2/scraps/LEtext3.gif",
		"storyfiles/hs2/scraps/LEtext4.gif",
		"storyfiles/hs2/scraps/LEtext5.gif",
		"storyfiles/hs2/scraps/LEtext6.gif",
		"storyfiles/hs2/00253/afterthought-showtime_piano.mp3",
		"storyfiles/hs2/00253/mspa_harlequin.mp3",
		"storyfiles/hs2/00253/wind.wav",
		"storyfiles/hs2/songs/alterniaboundsongs/A%20Tender%20Moment.mp3",
		"storyfiles/hs2/songs/alterniaboundsongs/Alterniabound.mp3",
		"storyfiles/hs2/songs/alterniaboundsongs/boyskylark.mp3",
		"storyfiles/hs2/songs/alterniaboundsongs/Crustacean.mp3",
		"storyfiles/hs2/songs/alterniaboundsongs/ERROR.mp3",
		"storyfiles/hs2/songs/alterniaboundsongs/herosgrowth.mp3",
		"storyfiles/hs2/songs/alterniaboundsongs/Horschestra.mp3",
		"storyfiles/hs2/songs/alterniaboundsongs/MEGALOVANIA.mp3",
		"storyfiles/hs2/songs/alterniaboundsongs/Nic_Cage_Romance.mp3",
		"storyfiles/hs2/songs/alterniaboundsongs/phrenicphever.mp3",
		"storyfiles/hs2/songs/alterniaboundsongs/secretrom.mp3",
		"storyfiles/hs2/songs/alterniaboundsongs/spidersclawLOOP2.mp3",
		"storyfiles/hs2/songs/alterniaboundsongs/terezistheme.mp3",
		"storyfiles/hs2/songs/alterniaboundsongs/THE_NIC_CAGE_SONG.mp3",
		"storyfiles/hs2/songs/alterniaboundsongs/VriskasTheme3.mp3",
		"storyfiles/hs2/songs/alterniaboundsongs/walkstabwalk.mp3",
		"scraps2/AHdance.gif",
		"scraps2/LONGWAYSBUNP.jpg",
		"scraps2/LONGWAYSBUNPizza.jpg",
		"scraps2/hscrollarrow.gif",
		"scraps2/vigilprince.gif",
		"artcredits",
		"soundcredits"
	]

	try {
		var response = await got("https://www.homestuck.com/map/story");
		var dom = new JSDOM(response.body)
		var mapImages = [...dom.window.document.getElementsByTagName('img')].map(img => img.src.split("images/")[1])
		mapImages.push('maps/map_04.gif');
		dom.window.close();
	}
	catch (error) {
		console.log(error + "Homestuck dot com fuckin cockblocked us")
	}
	
	return [].concat(
		siteImages,
		desktopImages,
		mapImages,
		scraps
	)
}

async function getParadoxSpaceUrls() {
	let comicPages = [];
	for (let i = 0; i < 291; i++){

	}
	
	return [].concat(
	)
}

function processLogsPage(rawPage, pageId){
	let story = pageId.replace("logs/log_", "")
	let content = rawPage
				.replace(/\?s=\d&p=/g, '/mspa/')
				.match(/^.*(?=<br>)/gm)

	setPageObj(data.logs, story, content);
}

async function processExtrasPage(rawPage, pageId){
	let story = pageId.split("/")[0];
	let page = pageId.split("/")[1];

	const dom = new JSDOM(rawPage);
	let content = dom.window.document.getElementsByTagName('table')[2];

	if (story === "waywardvagabond") {
		[...content.getElementsByTagName('img')].map(img => {img.src = `http://www.mspaintadventures.com/storyfiles/hs2/${pageId}/${img.src}`})
	}
	
	let toDownload = [...content.getElementsByTagName('img')].map(img => img.src)

	dom.window.close();

	pageObject = {
		title: "MS Paint Adventures", 
		pageId: page,
		content: content.innerHTML,
	};
	setPageObj(data[(story === "extras") ? "psExtras" : "wv"], page, pageObject);
	
	try {
		await downloadMedia(toDownload);
	}
	catch(error) {
		console.log(error)
	}
}

async function processCreditsPage(rawPage, pageId){
	const dom = new JSDOM(rawPage);

	let content;
	if (/art/.test(pageId))
		content = dom.window.document.getElementsByTagName('table')[2]
	else if (/sound/.test(pageId))
		content = dom.window.document.getElementById('content');

	dom.window.close();

	pageObject = {
		title: "MS Paint Adventures", 
		pageId: pageId,
		content: content.innerHTML,
	};
	setPageObj(data.credits, pageId, pageObject);
	
}

async function getBackFile(story, page) {
	let url = `http://www.mspaintadventures.com/${story}_back/${page}.txt`
	try {
		var response = await got(url);
		console.log (`${story}/${page}\x1b[32m ----> GOT BACK FILE "${response.body}"\x1b[0m `);
		return response.body
	}
	catch (error){
		if (!('response' in error)){
			console.log(error)
			console.log(`${story}/${page} \x1b[33m-> 404, GENERAL ERROR\x1b[0m `);
		}
		else if (error.response.statusCode == "404") {
			console.log(`${story}/${page} \x1b[33m-> 404, SKIPPING PAGE\x1b[0m `);
		}
		else {
			console.log(`${story}/${page} \x1b[33m ${error.response.statusCode}: URL (${url}) is not valid.\x1b[0m`);
		}
	}
}

async function processMspaPage(rawPage, pageId){
	/*
	Get parts from raw page	
		[0]: Title
		[1]: Forum ID (Useless)
		[2]: Timestamp
		[3]: Media
		[4]: Text
		[5]: Next Page
	*/

	let story = pageId.split("/")[0];
	let page = pageId.split("/")[1];

	//Format page into trimmed array
	var parts = rawPage.split("###");
	for (var i = 0; i < parts.length; i++){
		parts[i] = parts[i].trim();
	};

	let textContent;
	let toDownload;
	[textContent, toDownload] = filterHtml(parts[4]);

	let flag = parts[3].match(/^(F|J|S)(?=\|)/gm);
	if (flag) flag = flag[0]

	let media = await filterMedia(parts[3], page);
	toDownload = media.concat(toDownload);
	media = media.map(x => x.replace(/http\:\/\/((www|cdn)\.)?mspaintadventures\.com/g, ""));

	if (parseInt(page) >= 5664 && parseInt(page) <= 5981) {
		toDownload.push(getScratchBanner(page));
	}

	//Gets array of next page IDs
	let nextId = parts[5].split(/\r?\n/);
	nextId.pop(); //GETS RID OF EOF CHARACTER X

	//Inits next page if it doesnt exist
	if (story == "ryanquest") {
		nextId.forEach((id) =>{
			setPageObj(data.ryanquest, id, {previous: page});
		});
	}
	else{
		let previous = await getBackFile(story, page);
		if (previous) setPageObj(data.mspa, page, {previous: previous});
	}

	//Page object is assembled
	pageObject = {
		title: parts[0],
		pageId: page,
		timestamp: parts[2],
		flag: flag,
		media: media,
		content: textContent,
		next: nextId,
	};
	if (story == "ryanquest") {
		setPageObj(data.ryanquest, page, pageObject);
	}
	else {
		setPageObj(data.mspa, page, pageObject);
	}

	toDownload = unretcon(toDownload);
	console.log(`${pageId}\x1b[36m -> PAGE OBJECT GENERATED, DOWNLOADING MEDIA\x1b[0m`);

	try {
		await downloadMedia(toDownload);
	}
	catch(error) {
		console.log(error)
	}
}

//@pageId = "Y/0XXXXX"
async function deployWorker(pageId){
	workerCount++;

	let url = "";
	if (/\.(gif|jpg|png|swf|mp3|wav)$/.test(pageId)){
		//pageId is a straight media link
		url = `http://www.mspaintadventures.com/${pageId}`;
	}
	else if (/^(\d|ryanquest|logs)\//.test(pageId)){
		url = `http://www.mspaintadventures.com/${ pageId }.txt`;
	}
	else if (/^waywardvagabond/.test(pageId)) {
		url = `http://www.mspaintadventures.com/storyfiles/hs2/${ pageId }`;
	}
	else if (/^(extras|soundcredits|artcredits)/.test(pageId)) {
		url = `http://www.mspaintadventures.com/${ pageId }.html`;
	}
	else if (/^sbahj/.test(pageId)) {
		await processSbahj();
		pageId = undefined;
	}


	if (!!pageId) {
		if (/\.(gif|jpg|png|swf|mp3|wav)$/.test(pageId)) {
			await downloadMedia([url])
			console.log (`${pageId}\x1b[32m ----> COMPLETED\x1b[0m (${++pagesCompleted}/${totalPages})`);
		}
		else {
			try {
				var rawPage		
				if (/^(4\/00|logs\/log_4)/.test(pageId)){
					let response = await got(url, {responseType: 'buffer'});
					rawPage = iconv.decode(response.body, 'latin1')
				}
				else {
					let response = await got(url);
					rawPage = response.body
				}
				if (/^(\d|ryanquest)\//.test(pageId)){
					await processMspaPage(rawPage, pageId)
				}
				if (/^(logs)\//.test(pageId)){
					processLogsPage(rawPage, pageId)
				}
				else if (/^(waywardvagabond|extras)\//.test(pageId)) {
					await processExtrasPage(rawPage, pageId)
				}
				else if (/^(soundcredits|artcredits)/.test(pageId)) {
					await processCreditsPage(rawPage, pageId)
				}
				else if (/^(soundcredits|artcredits)/.test(pageId)) {
					await processCreditsPage(rawPage, pageId)
				}
				console.log (`${pageId}\x1b[32m ----> COMPLETED\x1b[0m (${++pagesCompleted}/${totalPages})`);
			}
			catch (error){
				if (!('response' in error)){
					console.log(error)
					console.log(`${pageId} \x1b[33m-> 404, GENERAL ERROR\x1b[0m (${++pagesCompleted}/${totalPages})`);
				}
				else if (error.response.statusCode == "404") {
					console.log(`${pageId} \x1b[33m-> 404, SKIPPING PAGE\x1b[0m (${++pagesCompleted}/${totalPages})`);
				}
				else {
					console.log(`${pageId} \x1b[33m ${error.response.statusCode}: URL (${url}) is not valid.\x1b[0m (${++pagesCompleted}/${totalPages})`);
				}
			}
		}
	}

	workerCount--;

	scrape();
}

async function scrape(){
	if (pages.length > 0) {
		while (workerCount < workerMax && pages.length > 0){
			let pageId = pages.shift();
			deployWorker(pageId);
		}
	}
	else if (workerCount <= 0){
		console.log("Task complete.");
		let json = JSON.stringify(data);
		fs.writeFile(`${outputDir}/story.json`, json, 'utf8', () =>{
			console.log("JSON Saved.");
			//process.exit();
		});
	} 
}

async function init() {
	pages = [];
	data = {
		"mspa": {},
		"ryanquest": {},
		"psExtras": {},
		"wv":{},
		"credits": {},
		"logs": {}
	}

	if (dataOptions.has('custom')) {
		pages = pages.concat(['4/000805', '4/001049']);
	}

	if (dataOptions.has('jb')) {
		pages = pages.concat([...Array(134).keys()].map(x => "1/"+(x + 2).toString().padStart(6, "0")).concat(['1/jb2_000000']));
	}
	if (dataOptions.has('bq')) {
		pages = pages.concat([...Array(81).keys()].map(x => "2/"+(x + 136).toString().padStart(6, "0")));
	}
	if (dataOptions.has('ps')) {
		pages = pages.concat([...Array(1674).keys()].map(x => "4/"+(x + 219).toString().padStart(6, "0")));
	}
	if (dataOptions.has('beta')) {
		pages = pages.concat([...Array(8).keys()].map(x => "5/"+(x + 1893).toString().padStart(6, "0")));
	}
	if (dataOptions.has('hs1')) {
		pages = pages.concat([...Array(1988).keys()].map(x => "6/"+(x + 1901).toString().padStart(6, "0")).concat(['6/pony'])); //Acts 1-4
	}
	if (dataOptions.has('hs2')) {
		pages = pages.concat([...Array(2124).keys()].map(x => "6/"+(x + 3889).toString().padStart(6, "0"))); //Act 5
	}
	if (dataOptions.has('hs3')) {
		pages = pages.concat([...Array(2135).keys()].map(x => "6/"+(x + 6013).toString().padStart(6, "0")).concat(['6/darkcage', '6/darkcage2', '6/pony2'])); //Act 6
	}
	if (dataOptions.has('hs4')) {
		pages = pages.concat([...Array(1888).keys()].map(x => "6/"+(x + 8143).toString().padStart(6, "0"))); //Act 6 Act 6 + Act 7
	}
	if (dataOptions.has('rq')) {
		pages = pages.concat([...Array(15).keys()].map(x => "ryanquest/"+(x + 1).toString().padStart(6, "0")).concat(['3/MC0001'])); //Ryanquest, BloodSpade
	}
	if (dataOptions.has('psExtras')) {
		pages = pages.concat([...Array(40).keys()].map(x => "extras/ps"+(x + 1).toString().padStart(6, "0")));
	}
	if (dataOptions.has('wv')) {
		pages = pages.concat(['recordsastutteringstep', 'astudiouseye', 'windsdownsideways', 'anunsealedtunnel', 'anagitatedfinger','beneaththegleam', 'asentrywakens', 'preparesforcompany'].map(x => "waywardvagabond/" + x));
	}
	if (dataOptions.has('logs')) {
		pages = pages.concat([1, 2, 4, 5, 6].map(x => `logs/log_${x}`));
	}
	if (dataOptions.has('sbahj')) {
		pages = pages.concat([...Array(54).keys()].map(x => `sweetbroandhellajeff/archive/0${(x + 1).toString().padStart(2, "0")}.jpg`))
			.concat([
				"awyeahbitches.gif",
				"back.jpg",
				"first.jpg",
				"logo.jpg",
				"madlewwtz.gif",
				"makemesomemoney.gif",
				"moneytile.gif",
				"new.jpg",
				"next.jpg",
				"sbahj_bookbanner.jpg",
				"SBAHJ_shirtbanner1.jpg",
				"SBAHJ_shirtbanner2.jpg",
				"SBAHJ_shirtbanner3.jpg",
				"SBAHJ_shirtbanner4.jpg",
				"skaterboarder.jpg",
				"movies/SBAHJthemovie1.swf"
			].map(x => `sweetbroandhellajeff/${x}` ));
		pages[20] = pages[20].replace( '\.jpg', '\.gif' );
		pages[28] = pages[28].replace( '\.jpg', '\.gif' );
		pages[33] = pages[33].replace( '\.jpg', '\.gif' );
		pages[48] = pages[48].replace( '\.jpg', '\.gif' );
	}
	if (dataOptions.has('pxs')) {
		pages = pages.concat(await getParadoxSpaceUrls());
	}
	if (dataOptions.has('extraMedia')) {
		pages = pages.concat( await getExtraMediaUrls());
	}

	pagesCompleted = 0;
	totalPages = pages.length;
	scrape();
}

init();