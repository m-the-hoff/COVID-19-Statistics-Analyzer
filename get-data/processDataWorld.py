#########################################################################
# processDataWorld.py
#
# Author:	Michael Hoffman
#			http://linkedin.com/in/mthoffman
#
# Description:
#
# Processes a CSV quary result for:
#
#	SELECT * FROM covid_19_cases
#
# from the database provided at:
#
# https://data.world/covid-19-data-resource-hub/covid-19-case-counts/
#
# NOTE: You are able to create your own workspace at this site and save
# your own SQL query which will provide a URL of the form:
#
#	https://download.data.world/s/{{your_unique_token_for_this_query}}
#
# This URL is the second argument to running this script
#
# You can also simply do the SELECT query on the website and download the
# dataset and rename to COVID-19-Cases.csv for this script to process.
#
# An export of the entire dataset
#
#########################################################################

import csv
import os
import sys
import requests
from os import path
from pprint import pprint
from datetime import datetime

gNextID = 1
gRegionsInfo = {}
gRegionsInfoByID = {}
gAllDates = set()
gSortedDates = []

gAltNameLookup = {
	"Alabama": "AL",
	"Alaska": "AK",
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
	"Virgin Islands, U.S.": "US Virgin Islands",
	"Utah": "UT",
	"Vermont": "VT",
	"Virginia": "VA",
	"Washington": "WA",
	"West Virginia": "WV",
	"Wisconsin": "WI",
	"Wyoming": "WY"

};

def rowToRegionIdentity( fieldToPos, row ):

	regionIdentity = {
		"id": 					row[fieldToPos["id"]],
		"regionLevel":			row[fieldToPos["regionLevel"] ],
		"regionLevel1":			row[fieldToPos["regionLevel1"] ],		# country or other top level region
		"regionLevel2":			row[fieldToPos["regionLevel2"] ],		# province or state
		"regionLevel3":			row[fieldToPos["regionLevel3"] ],		# county
		"regionType":			row[fieldToPos["regionType"] ],		# "country", "state", "province", "county", "other"
		"locationName":			row[fieldToPos["locationName"] ],		# fully location name
		"altLocationName":		row[fieldToPos["altLocationName"] ],		# abbreviated name
		"longitude":			row[fieldToPos["latitude"] ],
		"latitude":				row[fieldToPos["longitude"] ],
		"fips":					row[fieldToPos["fips"] ]		# Federal Information Processing System (FIPS) Codes
		}
	return regionIdentity



def processRegionIdentityCSV( csvFile ):
	global gNextID
	global gRegionsInfo
	global gRegionsInfoByID

	gRegionsInfo = dict()

	if path.exists(csvFile):
		print("Reading existing local region data: ", csvFile )
		with open(csvFile, newline='\n') as csvfile:
			rowStrList = csv.reader(csvfile, delimiter=',', quotechar='"')

			fieldNames = next(rowStrList)
			# print("Fieldnames to read: ", fieldNames )
			fieldToPos = {}
			for f in range(0,len(fieldNames)):
				fieldToPos[ fieldNames[f] ] = f

			for row in rowStrList:
				region = {}
				region["identity"] = rowToRegionIdentity( fieldToPos, row )
				region["key"] = key = makeKeyFromRegionIdentity( region["identity"] )
				region["cases"] = { "confirmed": {}, "deaths": {} }

				gRegionsInfo[key] = region
				gRegionsInfoByID[ region["identity"]["id"] ] = region
				regionID = int( region["identity"]["id"] )
				if gNextID <= regionID:
					gNextID = regionID + 1


def addEntryToRegions( key, regionLevel1, regionLevel2, regionLevel3, latitude, longitude, fips ):
	global gNextID
	global gRegionsInfo
	global gRegionsInfoByID

	regionLevel = 1

	if regionLevel2 == 'N/A':
		regionLevel2 = ''

	if regionLevel3:
		locationName = regionLevel3 + ", " + regionLevel2 + ', ' + regionLevel1
		regionLevel = 3
		regionType = "county"
	elif regionLevel2:
		locationName = regionLevel2 + ', ' + regionLevel1
		regionLevel = 2
		if regionLevel1 == "US":
			regionType = "state"
		else:
			regionType = "province"
	else:
		locationName = regionLevel1
		regionType = "country"
		regionLevel = 1

	if locationName in gAltNameLookup:
		altLocationName = gAltNameLookup[locationName];
	elif regionLevel == 2 and regionLevel2 in gAltNameLookup:
		altLocationName = gAltNameLookup[regionLevel2];
	else:
		altLocationName = ''

	print( "Adding missing region: ", locationName )

	regionIdentity = {
		"id": 					str(gNextID),
		"regionLevel":			regionLevel,
		"regionLevel1":			regionLevel1,
		"regionLevel2":			regionLevel2,
		"regionLevel3":			regionLevel3,
		"regionType":			regionType,
		"locationName":			locationName,
		"altLocationName":		altLocationName,
		"latitude":				latitude,
		"longitude":			longitude,
		"fips":					fips
	}


	region = {}
	region["identity"] = regionIdentity
	region["cases"] = { "confirmed": {}, "deaths": {} }

	gRegionsInfo[key] = region
	gRegionsInfoByID[ str(gNextID) ] = region

	gNextID += 1

	return region



def makeKeyFromRegionIdentity( regionIdentity ):
	if regionIdentity["regionLevel3"]:
		key = regionIdentity["regionLevel3"] + regionIdentity["regionLevel2"] + regionIdentity["regionLevel1"]
	elif regionIdentity["regionLevel2"] and regionIdentity["regionLevel2"] != 'N/A':
		key = regionIdentity["regionLevel2"] + regionIdentity["regionLevel1"]
	else:
		key = regionIdentity["regionLevel1"]

	key = key.replace(' ','').replace(',','').replace('.','')
	return key



def makeKeyFromCaseRow( fieldToPos, row ):
	fp1 = fieldToPos["country_region"]
	fp2 = fieldToPos["province_state"]
	fp3 = fieldToPos["admin2"]

	if row[ fp3 ]:
		key = row[ fp3 ] + row[ fp2 ] + row[ fp1 ]
	elif row[ fp2 ] and row[ fp2 ] != 'N/A':
		key = row[ fp2 ] + row[ fp1 ]
	else:
		key = row[ fp1 ]

	key = key.replace(' ','').replace(',','').replace('.','')
	return key


def fixMissingCounts():
	global gSortedDates
	okayCount = 0
	missingCount = 0


	gSortedDates = [ date for date in sorted(gAllDates) ]

	for key in gRegionsInfo:
		region = gRegionsInfo[key];
		fixMissingCountsForCase(region, "confirmed")
		fixMissingCountsForCase(region, "deaths")
		fixMissingCountsForCase(region, "recovered")
		fixMissingCountsForCase(region, "active")


def fixMissingCountsForCase( region, caseType ):
	if caseType in region["cases"] and region["identity"]["regionLevel3"] != "Unassigned":
		caseCounts = region["cases"][caseType]
		lastDate = gSortedDates[ len(gSortedDates) - 1 ]

		# These are not actually errors, they are just late reported data.
		#if lastDate in caseCounts:
		#	if caseCounts[ lastDate ] == '':
		#		print("empty last date: ", lastDate, region["identity"]["locationName"], caseType )
		#else:
		#	print("missing last date: ", lastDate, region["identity"]["locationName"], caseType )


def processDataWorldQuery(dataWorldUrl):

	print("Processing cases data directly from data.world" )

	response = requests.get(url = dataWorldUrl, params = {})
	csvText = response.text
	csvLines = csvText.split('\n')
	processCasesCSV( csvLines )


def processCasesCSVFile( csvFile ):
	with open(csvFile, newline='\n') as csvfile:
		print("Processing locally saved cases CSV file: ", csvFile )

		processCasesCSV(csvfile)


def processCasesCSV( csvIterable ):
	global gRegionsInfo

	rowStrList = csv.reader(csvIterable, delimiter=',', quotechar='"')

	fieldNames = next(rowStrList)
	fieldToPos = {}
	for f in range(0,len(fieldNames)):
		fieldToPos[ fieldNames[f] ] = f


	for row in rowStrList:
		if len(row):
			date 			= row[ fieldToPos["date"] ]
			regionLevel1 	= row[ fieldToPos["country_region"] ]
			regionLevel2 	= row[ fieldToPos["province_state"] ]
			regionLevel3 	= row[ fieldToPos["admin2"] ]
			caseType		= row[ fieldToPos["case_type"] ].lower()
			numCases		= row[ fieldToPos["cases"] ]
			latitude		= row[ fieldToPos["lat"] ]
			longitude		= row[ fieldToPos["long"] ]
			fips			= row[ fieldToPos["fips"] ]

			dateMDY = date.split('-')
			date = "%04d%02d%02d" % ( int(dateMDY[0]), int(dateMDY[1]), int(dateMDY[2]) )

			key = makeKeyFromCaseRow( fieldToPos, row )

			if ( key in gRegionsInfo ):
				region = gRegionsInfo[key]
			else:
				region = addEntryToRegions( key, regionLevel1, regionLevel2, regionLevel3, latitude, longitude, fips )

			region["cases"][caseType][date] = numCases
			gAllDates.add(date)		# create list of all encountered dates

	fixMissingCounts()



def exportRegionCSV(fileName):
	outF = open(fileName, "w")

	print("Writing region information CSV: ", fileName )

	keys = [
		"id",
		"regionLevel",
		"regionLevel1",
		"regionLevel2",
		"regionLevel3",
		"regionType",
		"locationName",
		"altLocationName",
		"latitude",
		"longitude",
		"fips"
	]

	line = ','.join( k for k in keys )
	outF.write(line)
	outF.write("\n")

	for key in gRegionsInfo:
		region = gRegionsInfo[key]
		line = ','.join( prepField( region["identity"][k] ) for k in keys )
		outF.write(line)
		outF.write("\n")
	outF.close()


def prepField(x):
	if type(x) == str and ',' in x:
		return '"' + str(x) + '"'
	else:
		return str(x)


def intToCompressedBinary(value):
	if value <= 0x7f:			# 7 bits
		return [0x80 + value]
	elif value <= 0x3fff:		# 14 bits
		v0 = value & 0x7f
		v1 = ((value >> 7) & 0x7f) + 0x80
		return [v0, v1]
	elif value <= 0x1fffff:		# 21 bits
		v0 = value & 0x7f
		v1 = (value >> 7 ) & 0x7f
		v2 = ((value >> 14) & 0x7f) + 0x80
		return [v0, v1, v2]
	elif value <= 0x0fffffff:	# 28 bits
		v0 = value & 0x7f
		v1 = (value >> 7 ) & 0x7f
		v2 = (value >> 14) & 0x7f
		v3 = ((value >> 21) & 0x7f) + 0x80
		return [v0, v1, v2, v3]
	else:						# 32 bits
		v0 = value & 0x7f
		v1 = (value >> 7 ) & 0x7f
		v2 = (value >> 14) & 0x7f
		v3 = (value >> 21) & 0x7f
		v4 = ((value >> 28) & 0x7f) + 0x80
		return [v0, v1, v2, v3, v4]



def writeVarInt(f, value):
	if value < 0:
		value = 0

	intBytes = intToCompressedBinary( value )
	binaryData = bytearray(intBytes)
	f.write(binaryData)



def readVarInt(byteStream):
	value = 0
	shiftAmt = 0
	for x in range(0,5):
		b = byteStream.read(1)
		b = b[0]
		value += int(b & 0x7f) << shiftAmt
		shiftAmt += 7
		if b & 0x80:
			return value
	return value


# varByte	# of region entries total
# varByte   id for region 1
# varByte	# days of confirmed
# varBytes  confirmed counts for region 1
# varByte	# days of deaths
# varBytes  deaths counts for region 1
# varByte	# days of recovered
# varBytes  recovered counts for region 1
# varByte	# days of active
# varBytes  active counts for region 1
#   . . .
# next region

def exportCaseData(fileName):
	f = open(fileName, 'w+b')

	print("Writing binary case data: ", fileName )

	writeVarInt( f, len(gRegionsInfo) )

	for key in gRegionsInfo:
		region = gRegionsInfo[key]
		writeVarInt(f, int(region["identity"]["id"]) )

		# print( "writing: ", key, region["identity"]["id"], region["identity"]["locationName"], len(region["cases"]["confirmed"]), len(region["cases"]["deaths"]))
		# print( region["identity"]["locationName"] )
		exportDates(f, region["cases"]["confirmed"] )
		exportDates(f, region["cases"]["deaths"] )
		exportDates(f, {} );		# recovered - no data currently available
		exportDates(f, {} );		# active  - no data currently available
		# exportDates(f, region["cases"]["recovered"])

	f.close()


def exportDates(f, caseDateCounts):
	numCounts = len(gAllDates)		# we assume there are no gaps in provided dates
	writeVarInt(f, numCounts )
	prevCount = 0

	for date in gSortedDates:
		if date in caseDateCounts and caseDateCounts[date].isnumeric():
			curCount = int(caseDateCounts[date])
			writeVarInt(f, curCount)
		else:
			writeVarInt(f, 0 )


def readCaseCounts(f):
	counts = []
	numCounts = readVarInt(f)
	for n in range(0,numCounts):
		counts.append( readVarInt(f) )
	return counts


def readCaseData(fileName):
	f = open(fileName, "rb")
	try:
		numEntries = readVarInt(f)
		print( "Total case entries processed: ", numEntries )
		for i in range(0,numEntries):
			id = str( readVarInt(f) )
			# print(id)
			if id in gRegionsInfoByID:
				region = gRegionsInfoByID[ id ]
				# print( id, region["identity"]["locationName"])

			confirmed	= readCaseCounts(f)
			deaths		= readCaseCounts(f)
			recovered	= readCaseCounts(f)
			active		= readCaseCounts(f)

			# print(confirmed)
			# print(deaths)
			# print(recovered)
			# print(active)
	finally:
		f.close()


def processAllData():
	global gRegionsInfo

	if len(sys.argv) == 1:
		print( "\nCommand:   " + sys.argv[0] + " path_to_files data_world_url")
		print( "                   where:  path_to_files   is where to read and write local files")
		print( "                           data_world_url  url to download CSV query directly from world.data" )
		print( "                                           if missing, read from '<<path_to_files>>/COVID-19-Cases.csv'\n\n")
	else:
		print("Processed on: ", datetime.now().strftime('%Y-%m-%d %H:%M:%S'))

		path = sys.argv[1]

		if path != '' and path[len(path)-1] != '/':
			path = path + '/'

		dataWorldQueryURL	= sys.argv[2]
		dataWorldCases 		= path + "COVID-19-Cases.csv"
		regionInfoOut 		= path + "regioninfo.csv"
		caseDataOut			= path + "caseinfo.dat"

		processRegionIdentityCSV(regionInfoOut)

		if len(sys.argv) == 2:
			processCasesCSVFile(dataWorldCases)
		else:
			processDataWorldQuery(dataWorldQueryURL)

		exportRegionCSV(regionInfoOut)
		exportCaseData(caseDataOut)
		readCaseData(caseDataOut)



if __name__ == "__main__":
    processAllData()
