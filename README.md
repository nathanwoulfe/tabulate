*Background

Instances exist on the website where content authors are maintaining large, generally well-structured data sets in the back office. This data is typically managed in HTML tables, which leaves little scope for presentation or additional functionality, and also requires content authors to ensure formatting and layout of the tables remains consistent.
To address that requirement, the Tabulate property editor manages simple structured data sets and by storing the data with that structure intact, allows for more engaging display on the front end of the site.

*Editor configuration

The editor has three configuration options, none of which are mandatory:

- Wide: sets the editor to display full-width within the content node tabs (ie hides the editor label)
- Admin-only settings: hides the settings button for users not of the admin type (ie authors)
- Custom view: sets a path to a custom view for use in the edit/add row dialog. If a custom view is used, a controller for the view will also need to be added and referenced in the Javascript dependencies object in the package.manifest file

Most of the configuration for each instance takes place in the editor itself, not as prevalues.

With the editor added to a document type, admin users will see a blue settings button in the top right corner.

The settings button opens the settings dialog, which includes three tabs (only two of which will be visible when the editor has no value).

**Add new column

The first tab allows addition of new columns - specify a name and select a display type (textstring, textarea or RTE).

**Current columns

The second tab - only visible when the editor has a value - displays the current columns added to the editor. From this tab, columns can be renamed, retyped or removed. 

This tab also allows the display label to be set. The label uses curly brackets to wrap the column names, with additional separator text permitted. For example:
{First name} {last name} (DOB: {Date of birth}) would render John Smith (DOB: 12-11-1985)
Nested properties can be accessed using the pipe separator, but only to single level of inheritance:
{name|last}
Sorting and paging are controlled from this tab. Sorting can be set to ascending, descending or manual.
Import/Export
The third tab allows importing and exporting data to and from the editor. Importing content will overwrite the existing data model. Data can be imported/exported as either CSV or JSON - the latter more appropriate for complex data structures, while CSV works only for flat data.
Importing JSON from one Tabulate instance to another (ie between environments) also imports settings for sorting, labelling etc.
Editor interface
Data rows are displayed in a paged list, with the label set in the settings section used as the display name. 
Clicking an existing row opens the edit dialog, displaying the content in editable fields. (Refer to image below)
If the object contains a property with the key 'Address', the latitude and longitude for the location are also displayed, with a link to view the location on a map.
On the map view, the pin can be repositioned with the resultant change to the latitude and longitude updated in the model. (Refer to image below)
Adding a new row to the model using the '+' button opens an empty dialog with inputs for each column defined in the settings.
The default view is filterable by label.
The clear all button does exactly that - deletes all content and settings from the editor.
Functionality
The editor follows the standard Umbraco property editor design patterns and uses the following Umbraco APIs:
authResource: check the current user type for determining display of the settings button
assetsService: injects the editor CSS and loads the Google Maps API
dialogService: manages display of the add/edit, settings and map dialogs
notificationsService: displays messaging in response to user activity
tabulate.controller.js
Base controller to manage the display of existing data, and trigger modal display of content rows and handle data manipulation in the callbacks from the modals.
tabulate.settings.controller.js
Manages the columns, sorting and import and export of data. Where possible - particularly in the functions around converting CSV to JSON and vice-versa, the code has been shifted into a separate factory
tabulate.resources.js
Factory to manage setting and updating pagination, view filtering and conversion between CSV and JSON formats. The factory also handles geocoding of addresses.
*Custom views

Extended for the Credit Calculator task, Tabulate includes the option to set a custom view for use in the add and edit dialogs. This allows more complex or larger data models to be displayed using a more intuitive UI as opposed to simply listing the properties as in the default dialog.
By including a custom view and associated controller, it's possible have data sourced from elsewhere in Umbraco (ie the course and program typeahead properties on the credit calculator). 
The dialogData.data object can be manipulated in the custom controller provided it is returned in the $scope.save function and maintains the correct column configuration as dictated by the editor configuration.
