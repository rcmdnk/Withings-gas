# Withings-gas
Google Apps Script for Withings

## Preparation

* Make new [Google Spreadsheet](https://sheet.new).
* Open script editor: **Tools**->**Script editor**.
* Add library: `1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDF` (OAuth2).
* Make new script files, and copy all gs files in this repository.
* Add properties:
    * Add following properties ([Manage script properties manually](https://developers.google.com/apps-script/guides/properties#manage_script_properties_manually)):
        * `CLIENT_ID`: CLIENT_ID of API.
        * `CLIENT_SECRET`: CLIENT_SECRET of API.
        * `EMAIL`: Optional. If not set, use the email address of script owner to notify errors.
    * CLIENT_ID and CLIENT_SECRET can be found as following:
        * Make sure you have a [Withings account](https://account.withings.com/connectionuser/account_create).
        * Register as [Withings API partner here](https://account.withings.com/partner/add_oauth2).
            * callback function should be like: `https://script.google.com/macros/d/<SCRIPT_ID>/usercallback`
            * `SCRIPT_ID` is found in the menu of Apps Script: File -> Project properties -> Script Id
        * Get client id and client (consumer) secret.

## Get Body information
Open `Measure.gs` and run function `body`.

## Get Sleep information
Open `Sleep.gs` and run function `sleepSummary`.
