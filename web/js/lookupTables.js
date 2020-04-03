/****************************************
** lookupTables.js
** by: Michael T Hoffman
**
** A variety of lookup tables to normalize
** data and provide extra information beyond
** the Johns Hopkins dataset
**
** TODO
**
**	- Disambiguate when provinces from different countries are same name, like "Diamond Princess"
**	- Only turn "Global" on when no countries OR states are selected
**	- Add "per beds"
**	- Ability to sort countries and states
**
**
****************************************/


// This lookup is primarily needed to get rid of Province names
// for any entry we want to consider to be a top level "Country",
// which includes a few exceptions like the Diamond Princess.
//
// It may be obsolete since JH normalized the data at their
// end.

var gProvinceSynonyms = {
	"US": "Other",
	"United States Virgin Islands": "US Virgin Islands"
};


var gRegionSynonyms = {
	"Gambia": "The Gambia",
	"Gambia, The": "The Gambia",
	"Bahamas": "The Bahamas",
	"Bahamas, The": "The Bahamas",
	"Cape Verde": "Cabo Verde",
	"Congo (Kinshasa)": "DR Congo",
	"Congo (Brazzaville)": "Congo Republic",
	"Côte d'Ivoire": "Cote d'Ivoire",
	"Cruise Ship": "Diamond Princess",
	"Czech Republic": "Czechia",
	"East Timor": "Timor-Leste",
	"Faroe Islands": "Faeroe Islands",
	"Holy See": "Vatican City",
	"Hong Kong SAR" : "Hong Kong",
	"Iran (Islamic Republic of)": "Iran",
	"Ivory Coast": "Côte d'Ivoire",
	"Korea, South": "South Korea",
	"Mainland China" : "China",
	"occupied Palestinian territory": "Palestine",
	"Republic of the Congo": "Congo Republic",
	"Republic of Korea": "South Korea",
	"Republic of Moldova": "Moldova",
	"Reunion" : "Réunion",
	"Russian Federation": "Russia",
	"Saint Barthelemy": "St. Barthelemy",
	"Saint Helena": "St. Helena",
	"Saint Kitts and Nevis": "St. Kitts & Nevis",
	"Saint Lucia": "St. Lucia",
	"Saint Martin": "St. Martin",
	"Saint Pierre & Miquelon": "St. Pierre & Miquelon",
	"Saint Vincent and the Grenadines": "St. Vincent & Grenadines",
	"Taipei and environs": "Taiwan",
	"Taiwan*": "Taiwan",
	"United Kingdom": "UK",
	"Viet Nam": "Vietnam"
};

var gPrimaryRegionsUSA = {
	"Alabama": "AL",
	"Alaska": "AK",
	"American Samoa, US": "American Samoa",
	"Arizona": "AZ",
	"Arkansas": "AR",
	"California": "CA",
	"Colorado": "CO",
	"Connecticut": "CT",
	"Delaware": "DE",
	"Diamond Princess": "Diamond Princess (US)",
	"District of Columbia": "DC",
	"Florida": "FL",
	"Georgia": "GA",
	"Grand Princess": "Grand Princess (US)",
	"Guam": "Guam",
	"Hawaii": "HI",
	"Idaho": "ID",
	"Illinois": "IL",
	"Indiana": "IN",
	"Iowa": "IA",
	"Kansas": "KS",
	"Kentucky": "KY",
	"Louisiana": "LA",
	"Maine": "ME",
	"Maryland": "MD",
	"Massachusetts": "MA",
	"Michigan": "MI",
	"Minnesota": "MN",
	"Mississippi": "MS",
	"Missouri": "MO",
	"Montana": "MT",
	"Nebraska": "NE",
	"Nevada": "NV",
	"New Hampshire": "NH",
	"New Jersey": "NJ",
	"New Mexico": "NM",
	"New York": "NY",
	"Northern Mariana Islands, US": "Northern Mariana Islands",
	"North Carolina": "NC",
	"North Dakota": "ND",
	"Ohio": "OH",
	"Oklahoma": "OK",
	"Oregon": "OR",
	"Pennsylvania": "PA",
	"Puerto Rico": "Puerto Rico",
	"Rhode Island": "RI",
	"South Carolina": "SC",
	"South Dakota": "SD",
	"Tennessee": "TN",
	"Texas": "TX",
	"Virgin Islands, US": "US Virgin Islands",
	"Utah": "UT",
	"Vermont": "VT",
	"Virginia": "VA",
	"Washington": "WA",
	"West Virginia": "WV",
	"Wisconsin": "WI",
	"Wyoming": "WY"

};


var gPopulationLookup = {
	"Afghanistan": 38928346,
	"Albania": 2877797,
	"Algeria": 43851044,
	"Andorra": 77265,
	"Angola": 32866272,
	"Anguilla": 15003,
	"Antigua and Barbuda": 97929,
	"Argentina": 45195774,
	"Armenia": 2963243,
	"Aruba": 106766,
	"Australia": 25499884,
	"Austria": 9006398,
	"Azerbaijan": 10139177,
	"Bahrain": 1701575,
	"Bangladesh": 164689383,
	"Barbados": 287375,
	"Belarus": 9449323,
	"Belgium": 11589623,
	"Belize": 397628,
	"Benin": 12123200,
	"Bermuda": 62278,
	"Bhutan": 771608,
	"Bolivia": 11673021,
	"Bosnia and Herzegovina": 3280819,
	"Botswana": 2351627,
	"Brazil": 212559417,
	"British Virgin Islands": 30231,
	"Brunei": 437479,
	"Bulgaria": 6948445,
	"Burkina Faso": 20903273,
	"Burma": 53370000,
	"Burundi": 11890784,
	"Cabo Verde": 555987,
	"Cambodia": 16718965,
	"Cameroon": 26545863,
	"Canada": 37742154,
	"Caribbean Netherlands": 26223,
	"Cayman Islands": 65722,
	"Central African Republic": 4829767,
	"Chad": 16425864,
	"Channel Islands": 173863,
	"Chile": 19116201,
	"China": 1439323776,
	"Colombia": 50882891,
	"Comoros": 869601,
	"Congo Republic": 5518087,
	"Cook Islands": 17564,
	"Costa Rica": 5094118,
	"Croatia": 4105267,
	"Cuba": 11326616,
	"Curaçao": 164093,
	"Cyprus": 1207359,
	"Czechia": 10708981,
	"Cote d'Ivoire": 26378274,
	"Denmark": 5792202,
	"Diamond Princess": 3534,		// Diamond Princes Cruise Ship
	"Diamond Princess (US)": 3534,		// Diamond Princes Cruise Ship
	"Djibouti": 988000,
	"Dominica": 71986,
	"Dominican Republic": 10847910,
	"DR Congo": 89561403,
	"Ecuador": 17643054,
	"Egypt": 102334404,
	"El Salvador": 6486205,
	"Equatorial Guinea": 1402985,
	"Eritrea": 3546421,
	"Estonia": 1326535,
	"Eswatini": 1160164,
	"Ethiopia": 114963588,
	"Faeroe Islands": 48863,
	"Falkland Islands": 3480,
	"Fiji": 896445,
	"Finland": 5540720,
	"France": 65273511,
	"French Guiana": 298682,
	"French Polynesia": 280908,
	"Gabon": 2225734,
	"Georgia": 3989167,
	"Germany": 83783942,
	"Ghana": 31072940,
	"Gibraltar": 33691,
	"Grand Princess": 3533,
	"Greece": 10423054,
	"Greenland": 56770,
	"Grenada": 112523,
	"Guadeloupe": 400124,
	"Guam": 168775,
	"Guatemala": 17915568,
	"Guernsey": 67052,
	"Guinea": 13132795,
	"Guinea-Bissau": 1968001,
	"Guyana": 786552,
	"Haiti": 11402528,
	"Honduras": 9904607,
	"Hong Kong": 7496981,
	"Hungary": 9660351,
	"Iceland": 341243,
	"India": 1380004385,
	"Indonesia": 273523615,
	"Iran": 83992949,
	"Iraq": 40222493,
	"Ireland": 4937786,
	"Isle of Man": 85033,
	"Israel": 8655535,
	"Italy": 60461826,
	"Jamaica": 2961167,
	"Japan": 126476461,
	"Jordan": 10203134,
	"Kazakhstan": 18776707,
	"Kenya": 53771296,
	"Kiribati": 119449,
	"Kuwait": 4270571,
	"Kosovo": 1831000,
	"Kyrgyzstan": 6524195,
	"Laos": 7275560,
	"Latvia": 1886198,
	"Lebanon": 6825445,
	"Lesotho": 2142249,
	"Liberia": 5057681,
	"Libya": 6871292,
	"Liechtenstein": 38128,
	"Lithuania": 2722289,
	"Luxembourg": 625978,
	"Macao SAR": 649335,
	"Madagascar": 27691018,
	"Malawi": 19129952,
	"Malaysia": 32365999,
	"Maldives": 540544,
	"Mali": 20250833,
	"Malta": 441543,
	"Marshall Islands": 59190,
	"Martinique": 375265,
	"Mauritania": 4649658,
	"Mauritius": 1271768,
	"Mayotte": 272815,
	"Mexico": 128932753,
	"Micronesia": 115023,
	"Moldova": 4033963,
	"Monaco": 39242,
	"Mongolia": 3278290,
	"Montenegro": 628066,
	"Montserrat": 4992,
	"Morocco": 36910560,
	"Mozambique": 31255435,
	"Myanmar": 54409800,
	"Namibia": 2540905,
	"Nauru": 10824,
	"Nepal": 29136808,
	"Netherlands": 17134872,
	"New Caledonia": 285498,
	"New Zealand": 4822233,
	"Nicaragua": 6624554,
	"Niger": 24206644,
	"Nigeria": 206139589,
	"Niue": 1626,
	"North Korea": 25778816,
	"North Macedonia": 2083374,
	"Norway": 5421241,
	"Oman": 5106626,
	"Pakistan": 220892340,
	"Palau": 18094,
	"Palestine": 5101414,
	"Panama": 4314767,
	"Papua New Guinea": 8947024,
	"Paraguay": 7132538,
	"Peru": 32971854,
	"Philippines": 109581078,
	"Poland": 37846611,
	"Portugal": 10196709,
	"Puerto Rico": 2860853,
	"Qatar": 2881053,
	"Romania": 19237691,
	"Russia": 145934462,
	"Rwanda": 12952218,
	"Réunion": 859959,
	"Réunion": 895312,
	"Samoa": 198414,
	"San Marino": 33931,
	"Sao Tome & Principe": 219159,
	"Saudi Arabia": 34813871,
	"Senegal": 16743927,
	"Serbia": 8737371,
	"Seychelles": 98347,
	"Sierra Leone": 7976983,
	"Singapore": 5850342,
	"Sint Maarten": 42876,
	"Slovakia": 5459642,
	"Slovenia": 2078938,
	"Solomon Islands": 686884,
	"Somalia": 15893222,
	"South Africa": 59308690,
	"South Korea": 51269185,
	"South Sudan": 11193725,
	"Spain": 46754778,
	"Sri Lanka": 21413249,
	"St. Barthelemy": 9877,
	"St. Helena": 6077,
	"St. Kitts & Nevis": 53199,
	"St. Lucia": 183627,
	"St. Martin": 38666,
	"St. Pierre & Miquelon": 5794,
	"St. Vincent & Grenadines": 110940,
	"Sudan": 43849260,
	"Suriname": 586632,
	"Sweden": 10099265,
	"Switzerland": 8654622,
	"Syria": 17500658,
	"Taiwan": 23816775,
	"Tajikistan": 9537645,
	"Tanzania": 59734218,
	"Thailand": 69799978,
	"The Bahamas": 393244,
	"The Gambia": 2416668,
	"Timor-Leste": 1318445,
	"Togo": 8278724,
	"Tokelau": 1357,
	"Tonga": 105695,
	"Trinidad and Tobago": 1399488,
	"Tunisia": 11818619,
	"Turkey": 84339067,
	"Turkmenistan": 6031200,
	"Turks and Caicos": 38717,
	"Tuvalu": 11792,
	"Virgin Islands, U.S.": 104425,
	"Uganda": 45741007,
	"UK": 67886011,
	"Ukraine": 43733762,
	"United Arab Emirates": 9890402,
	"Uruguay": 3473730,
	"US": 331002651,
	"Uzbekistan": 33469203,
	"Vanuatu": 307145,
	"Vatican City": 801,
	"Venezuela": 28435940,
	"Vietnam": 97338579,
	"Wallis & Futuna": 11239,
	"Western Sahara": 597339,
	"West Bank and Gaza": 4685000,
	"Yemen": 29825964,
	"Zambia": 18383955,
	"Zimbabwe": 14862924,

	"AL": 4903185,
	"AK": 731545,
	"AZ": 7278717,
	"AR": 3017825,
	"CA": 39512223,
	"CO": 5758736,
	"CT": 3565287,
	"DE": 973764,
	"DC": 705749,
	"FL": 21477737,
	"GA": 10617423,
	"HI": 1415872,
	"ID": 1787147,
	"IL": 12671821,
	"IN": 6732219,
	"IA": 3155070,
	"KS": 2913314,
	"KY": 4467673,
	"LA": 4648794,
	"ME": 1344212,
	"MD": 6045680,
	"MA": 6949503,
	"MI": 9986857,
	"MN": 5639632,
	"MS": 2976149,
	"MO": 6137428,
	"MT": 1068778,
	"NE": 1934408,
	"NV": 3080156,
	"NH": 1359711,
	"NJ": 8882190,
	"NM": 2096829,
	"NY": 19453561,
	"NC": 10488084,
	"ND": 762062,
	"OH": 11689100,
	"OK": 3956971,
	"OR": 4217737,
	"PA": 12801989,
	"RI": 1059361,
	"SC": 5148714,
	"SD": 884659,
	"TN": 6833174,
	"TX": 28995881,
	"UT": 3205958,
	"VT": 623989,
	"VA": 8535519,
	"WA": 7614893,
	"WV": 1792065,
	"WI": 5822434,
	"WY": 578759,

	"Puerto Rico": 3193694,
	"Guam": 165718,
	"Virgin Islands, US": 104914,
	"American Samoa, US": 55641,
	"Northern Mariana Islands, US": 55194
};




// US States: https://www.kff.org/other/state-indicator/beds-by-ownership
// https://data.worldbank.org/indicator/SH.MED.BEDS.ZS
// http://www.econstats.com/wdi/wdiv_912.htm
// https://www.cia.gov/library/publications/the-world-factbook/fields/360.html
// https://www.paho.org/hq/dmdocuments/2012/2012-hia-puertorico.pdf
// https://hifld-geoplatform.opendata.arcgis.com/datasets/hospitals/data?selectedAttribute=BEDS
// https://www.indexmundi.com/
// https://www.bbc.com/news/world-europe-guernsey-30896020

gBedsPer1KLookup = {
	"Afghanistan": 0.5,								//indexMundi 2014
	"Albania": 2.9,										//indexMundi 2013
	"Algeria": 1.9,										//indexMundi
	"Andorra": 2.5,										//indexMundi
	"Angola": 0.8,
	"Antigua and Barbuda": 3.8,				//indexMundi
	"Argentina": 5,										//indexMundi
	"Armenia": 4.2,										//indexMundi
	"Aruba": 3.17,
	"Australia": 3.84,								//indexMundi = 7.6
	"Austria": 7.6,										//indexMundi
	"Azerbaijan": 4.7,								//indexMundi
	"Bahrain": 2.0,										//indexMundi
	"Bangladesh": 0.8,								//indexMundi
	"Barbados": 5.8,									//indexMundi
	"Belarus": 11,
	"Belgium": 6.2,										//indexMundi 2014
	"Belize": 0.8,
	"Benin": 0.7,
	"Bhutan": 0.7,
	"Bolivia": 0.7,
	"Bosnia and Herzegovina": 0.7,
	"Botswana": 0.6,
	"Brazil": 0.9,
	"Brunei": 0.8,
	"Bulgaria": 0.8,
	"Burkina Faso": 0.8,
	"Burma": 0.8,
	"Burundi": 0.7,
	"Cabo Verde": 0.9,
	"Cambodia": 0.8,
	"Cameroon": 0.9,
	"Canada": 2.52,
	"Cayman Islands": 3,
	"Central African Republic": 1,
	"Chad": 1,
	"Chile": 2.11,
	"China": 4.34,
	"Colombia": 1.7,
	"Cote d'Ivoire": 0.4,
	"Comoros": 1.1,
	"Congo Republic": 1.6,
	"Costa Rica": 1.3,
	"Croatia": 1.2,
	"Cuba": 1.2,
	"Cyprus": 1.3,
	"Czechia": 6.63,
	"Denmark": 2.61,
	"Diamond Princess": 1.0, // placeholder
	"Diamond Princess (US)": 1.0, // placeholder
	"Djibouti": 1.3,
	"Dominica": 1.3,
	"Dominican Republic": 1.3,
	"DR Congo": 0.8,
	"Ecuador": 1.3,
	"Egypt": 1.2,
	"El Salvador": 1.4,
	"Equatorial Guinea": 1.4,
	"Eritrea": 1.4,
	"Estonia": 4.69,
	"Eswatini": 1.4,
	"Ethiopia": 1.5,
	"Faroe Islands": 1.5,
	"Fiji": 1.5,
	"Finland": 3.28,
	"France": 6.1,
	"French Guiana": 2.7,
	"Gabon": 1.6,
	"Gaza Strip": 1.6,							// superceded by 'West Bank and Gaza
	"Georgia": 1.6,
	"Germany": 8.1,
	"Ghana": 1.7,
	"Grand Princess": 1.0, // placeholder
	"Greece": 4.21,
	"Greenland": 1.7,
	"Grenada": 1.9,
	"Guadeloupe": 5.5,
	"Guatemala": 13.4,
	"Guernsey": 2.33,									// 156 beds
	"Guinea": 1.8,
	"Guinea-Bissau": 1.9,
	"Guyana": 13.2,
	"Haiti": 11.5,
	"Honduras": 11,
	"Hong Kong": 5.4,
	"Hungary": 7.02,
	"Iceland": 3.06,
	"India": 2,
	"Indonesia": 2,
	"Iran": 2.1,
	"Iraq": 2.1,
	"Ireland": 2.96,
	"Israel": 3.02,
	"Italy": 3.18,
	"Jamaica": 2.3,
	"Japan": 13.05,
	"Jordan": 2.1,
	"Kazakhstan": 2.2,
	"Kenya": 2.2,
	"Kiribati": 2.4,
	"Kosovo": 2.88, 						// 5,269 beds, 1.831 million pop
	"Kuwait": 2.5,
	"Kyrgyzstan": 2.7,
	"Laos": 2.7,
	"Latvia": 5.57,
	"Lebanon": 2.6,
	"Liberia": 2.7,
	"Libya": 2.7,
	"Liechtenstein": 8.3,
	"Lithuania": 6.56,
	"Luxembourg": 4.66,
	"Madagascar": 2.6,
	"Malawi": 2.6,
	"Malaysia": 2.8,
	"Maldives": 2.8,
	"Mali": 2.8,
	"Malta": 2.8,
	"Marshall Islands": 3,
	"Martinique": 4.1,
	"Mauritania": 0.4,
	"Mauritius": 2.9,
	"Mayotte": 0.92,				// 252 beds
	"Mexico": 1.38,
	"Micronesia": 2.9,
	"Moldova": 2.9,
	"Monaco": 3,
	"Mongolia": 2.9,
	"Montenegro": 3,
	"Morocco": 3.1,
	"Mozambique": 3.2,
	"Namibia": 3.1,
	"Nauru": 3.4,
	"Nepal": 3.4,
	"Netherlands": 3.32,
	"New Zealand": 2.71,
	"Nicaragua": 3.4,
	"Niger": 0.31,
	"Nigeria": 0.4,
	"North Korea": 2.4,
	"North Macedonia": 3.7,
	"Norway": 3.6,
	"Oman": 3.6,
	"Pakistan": 3.6,
	"Palau": 3.7,
	"Panama": 3.8,
	"Papua New Guinea": 4.0,
	"Paraguay": 3.8,
	"Peru": 3.8,
	"Philippines": 3.8,
	"Poland": 6.62,
	"Portugal": 3.39,
	"Qatar": 4.4,
	"Réunion": 1.13,		 // 351 + 524 + 100 best guess
	"Romania": 4.3,
	"Russia": 8.05,
	"Rwanda": 1.6,
	"St. Kitts & Nevis": 4.2,
	"St. Lucia": 4,
	"St. Vincent & Grenadines": 4.1,
	"San Marino": 4.6,
	"Sao Tome and Principe": 4,
	"Saudi Arabia": 4.5,
	"Senegal": 4.4,
	"Serbia": 4.7,
	"Seychelles": 4.7,
	"Singapore": 4.7,
	"Slovakia": 5.82,
	"Slovenia": 4.5,
	"Solomon Islands": 4.8,
	"Somalia": 4.8,
	"South Africa": 2.8,
	"South Korea": 12.27,
	"Spain": 2.97,
	"Sri Lanka": 5.8,
	"Sudan": 4.9,
	"Suriname": 5,
	"Sweden": 2.22,
	"Switzerland": 4.53,
	"Syria": 5.4,
	"Taiwan": 6.98,
	"Tajikistan": 5.2,
	"Tanzania": 6.3,
	"Thailand": 6.3,
	"The Bahamas": 0.5,
	"The Gambia": 1.6,
	"Timor-Leste": 6.5,
	"Togo": 5,
	"Tonga": 6.2,
	"Trinidad and Tobago": 5.9,
	"Tunisia": 5.8,
	"Turkey": 2.81,
	"Turkmenistan": 6.5,
	"Uganda": 6.5,
	"Ukraine": 5.8,
	"United Arab Emirates": 7,
	"UK": 2.54,
	"US": 2.77,
	"Uruguay": 6.7,
	"Uzbekistan": 7.6,
	"Vanuatu": 7.4,
	"Vatican City": 1.0, // not actual. placeholder
	"Venezuela": 7.3,
	"Vietnam": 8.2,
	"West Bank": 8.2,
	"West Bank and Gaza": 8.2,
	"Yemen": 8.3,
	"Zambia": 8.8,
	"Zimbabwe": 8.7,

	"AL": 3.1,
	"AK": 2.2,
	"AZ": 1.9,
	"AR": 3.2,
	"CA": 1.8,
	"CO": 1.9,
	"CT": 2,
	"DE": 2.2,
	"DC": 4.4,
	"FL": 2.6,
	"GA": 2.4,
	"HI": 1.9,
	"ID": 1.9,
	"IL": 2.5,
	"IN": 2.7,
	"IA": 3,
	"KS": 3.3,
	"KY": 3.2,
	"LA": 3.3,
	"ME": 2.5,
	"MD": 1.9,
	"MA": 2.3,
	"MI": 2.5,
	"MN": 2.5,
	"MS": 4,
	"MO": 3.1,
	"MT": 3.3,
	"NE": 3.6,
	"NV": 2.1,
	"NH": 2.1,
	"NJ": 2.4,
	"NM": 1.8,
	"NY": 2.7,
	"NC": 2.1,
	"ND": 4.3,
	"OH": 2.8,
	"OK": 2.8,
	"OR": 1.6,
	"PA": 2.9,
	"RI": 2.1,
	"SC": 2.4,
	"SD": 4.8,
	"TN": 2.9,
	"TX": 2.3,
	"UT": 1.8,
	"VT": 2.1,
	"VA": 2.1,
	"WA": 1.7,
	"WV": 3.8,
	"WI": 2.1,
	"WY": 3.5,

	"Guam": 1.87,
	"Puerto Rico": 3.1,
	"Virgin Islands, US": 3.33,							// 188 + 169 beds.
	"Northern Mariana Islands, US": 1.56,		// 86 beds
	"American Samoa, US": 2.3								// 128 beds

};