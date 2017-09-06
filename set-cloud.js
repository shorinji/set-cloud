let fs = require("fs-extra"),
	ini = require("ini"),
	pathSep = require("path").sep,
	httpProxy = require('http-proxy');

/*
let appNameMap = {
		ls: 	'Localsearch',
		yelp: 	'Yelp',
		wiki: 	'WikiLocations',
		vn: 	'VoiceNote',
		tunein: 'Tunein'
	},
*/
let cloudMap = {
		test1:  { },
		test2: 	{ UrlSource: 3 },
		qa:  	{ UrlSource: 4, ManualUrl: "http://cep.eu.veri.ericssoncvc.com" },
	};
	
	cloudPorts = {
		test1: 8088,
		test2: 8089,
		qa:    8090
	};


function updateFrameworkInis(cloud) {
	let appName = "localsearch",
		spaTempDirRoot = [process.env['TEMP'], "spa"].join(pathSep),
		appNames = fs.readdirSync(spaTempDirRoot);

	appNames.forEach(function(appName) {

		let absAppPath = spaTempDirRoot + pathSep + appName,
			fwIni = absAppPath + pathSep + "Framework.ini",
			fwIniBak = fwIni + ".bak",
			featuresXmlPath = absAppPath + pathSep + "features.xml";

		try {
			let f = fs.readFileSync(fwIni, 'utf-8'),
				iniConfig = ini.parse(f);

			iniConfig.Cloud = {};

			if ('UrlSource' in cloud) {
				iniConfig.Cloud.UrlSource = cloud.UrlSource;
			}

			if ('ManualUrl' in cloud) {
				iniConfig.Cloud.ManualUrl = ini.safe(cloud.ManualUrl);
			}

			if (!fs.existsSync(fwIniBak)) {
				fs.copySync(fwIni, fwIniBak);
				console.log("Wrote backup to " + fwIniBak);
			}

			fs.writeFileSync(fwIni, ini.stringify(iniConfig));
			console.log("Wrote", cloudId, "to", "%TEMP%/Spa/" + appName + "/Framework.ini");
		} catch(e) {

		}
		
		if (fs.existsSync(featuresXmlPath)) {
			fs.unlinkSync(featuresXmlPath);
			console.log("Removed features.xml");
		}

	});
}

function refreshPidFile() {
	let fileName = process.env['TEMP'] + pathSep + "_proxyPid";
	try {
		let oldPid = fs.readFileSync(fileName, 'utf-8');
		process.kill(oldPid);
		console.log("Killed old pid", oldPid);
	} catch (e) {
		console.log("No pid file found");
	}
	fs.writeFileSync(fileName, process.pid);
}

function startProxy(inPort, outPort) {
	let options = { target: { host: "127.0.0.1", port: outPort }};

	console.log("Starting proxy:", inPort, "=>", outPort, "(cloud:", cloudId + ") (pid:", process.pid + ")");
	httpProxy.createProxyServer(options).listen(inPort);
}

let cloudId,
	hasValidCloud = (process.argv.length >= 2) && (process.argv[2] in cloudMap);

if (!hasValidCloud) {
	cloudId = "test1";
	/*
	console.log("Usage:", process.argv[1], "appname cloud")
	console.log("Available clouds:");
	Object.keys(cloudMap).forEach(function(k, i) {
		console.log("\t", k);
	});
	process.exit(-1);
	*/
} else {
	cloudId = process.argv[2]
}

cloud = cloudMap[cloudId];

updateFrameworkInis(cloud);
refreshPidFile();


let inPort = 8000,
	outPort = cloudPorts[cloudId];

startProxy(inPort, outPort);
