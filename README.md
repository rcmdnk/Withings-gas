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

## Parameters

Edit params.gs if you want to change the parameters.

## Fill data in the spreadsheet

### Fill Body information
Open `Measure.gs` and run function `body`.

### Fill Sleep information
Open `Sleep.gs` and run function `sleepSummary`.


## Schedule job

It is good to schedule the job to retrieve messages every day.

* Go `Trigger` (Clock icon) in the Apps Script project.
* `Add Trigger`
    * Choose which function to run: `body`
    * Which runs at deployment: `Head`
    * Select event source: `Time-driven`
    * Select type of time based trigger: `Day timer`
    * Select time of day: `0 am to 1 am`

This trigger fill body data between 0 am to 1 am every day.

Set a trigger for `sleepSummary` as well.
