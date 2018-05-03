let fs = require("fs-extra"),
	ini = require("ini"),
	pathSep = require("path").sep,
	httpProxy = require('http-proxy');

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
	let spaTempDirRoot = [process.env['USERPROFILE'], ".spa"].join(pathSep),
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


let cloudId,
	hasValidCloud = (process.argv.length >= 2) && (process.argv[2] in cloudMap);

if (!hasValidCloud) {
	cloudId = "test1";
} else {
	cloudId = process.argv[2]
}

updateFrameworkInis(cloudMap[cloudId]);

