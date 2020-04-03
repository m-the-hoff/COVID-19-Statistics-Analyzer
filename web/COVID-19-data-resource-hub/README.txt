The two files in this directory are created automatically by the python script at get-data/processDataWorld.py

caseinfo.dat			Contains a compact set of confirmed and death data for all regions for all days.
									Each region is identified by an integer ID that references the region data in regioninfo.csv

regioninfo.csv		Contains all regions that are currently available in the data set.  Regions include:
											countries
											states
											provinces
											counties

For local testing, these 2 files can be dropped directly onto the provided drop zone when the index.html file is opened in a local browser. When index.html is loaded from a web server, these are retrieved automatically because they won't invoke a cross domain error.


processDataWorld.py can either process a local CSV data file, or retreive directly from https://data.world/covid-19-data-resource-hub/

See the processDataWorld.py file header for more information

