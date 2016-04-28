# Overview
Tabulate exists to manage instances where content authors are maintaining large, generally well-structured data sets in the Umbraco back office.

A Tabulate instance stores data in the structure below:

```js
    {
    "data": [ /* an array of objects representing the rows in the back office editor */],
        "config": {
            "columns":[], // the columns set for the view, if any
            "label":"{name}", // the label format string
            "numPerPage":2, // pagination
            "sortOrder":"M", // sorting - ascending, descending or manual
            "labelChanged":true // trigger for regenerating object labels - true when config has changed
        },
        "alias":"programLocations", // the editor alias
        "selection":[], // stores the object selected for editing
        "columnsToRemove":[] // populated by changes to the config object
    }
```

# Editor configuration
The editor has three configuration options, none of which are mandatory:

- Wide: sets the editor to display full-width within the content node tabs (ie hides the editor label)
- Admin-only settings: hides the settings button for users not of the admin type (ie authors)
- Custom view: sets a path to a custom view for use in the edit/add row dialog. If a custom view is used, a controller for the view will also need to be added and referenced in the Javascript dependencies object in the package.manifest file.

Additional configuration for a Tabulate instance takes place in the editor itself, not as prevalues.

With the editor added to a document type, admin users will see a blue settings button in the top right corner.
The settings button opens the settings dialog, which includes three tabs:

## Add new column
The first tab allows addition of new columns - specify a name and select a display type (textstring, textarea or RTE).

## Current columns

The second tab - displays the current columns added to the editor. From this tab, columns can be renamed, retyped or removed. 

This tab also allows the display label to be set. The label uses `{}` to wrap the column names, with additional separator text permitted. 

For example:

- `{First name} {Last name} (DOB: {Date of birth})` would render John Smith (DOB: 12-11-1985), assuming the instances has columns named `First name`, `Last name` and `Date of birth`.
- Nested properties can be accessed using the pipe separator, but only to single level of inheritance: `{name|last}`

Sorting and paging are controlled from this tab. Sorting can be set to ascending, descending or manual. Pagination in the view is disabled when manual sorting is selected

## Import/Export
The third tab allows importing and exporting data to and from the editor. Importing content will overwrite the existing data model. Data can be imported/exported as either CSV or JSON - the latter more appropriate for complex data structures, while CSV works only for flat data.

Importing JSON from one Tabulate instance to another (ie between environments) also imports settings for sorting, labelling etc.

## Mapping
Data can be shared between Tabulate instances on the same node - for example, an instance might store a set of store names, locations, opening hours and summaries, and have the store names mapped to a second instance, where the names are available as a typeahead source for a property value. 

Changes to the mapped instance are automatically updated in the target, however setting an instance as a datasource is a manual task as part of developing a custom dialog view. The example below might be useful:

```js
    angular.forEach(editorState.current.tabs[0].properties, function (p) {
    	if (p.alias === 'mappedTabulateInstanceAlias') {
    		vm.typeaheadSource = p.value.data;
    	}
    });
```

# Editor interface
Data rows are displayed in a paged list, with the label set in the settings section used as the display name. 

Clicking an existing row opens the edit dialog, displaying the content in editable fields.

If the object contains a property with the key 'Address', the latitude and longitude for the location are also displayed, with a link to view the location on a map.

On the map view, the pin can be repositioned with the resulting change to the latitude and longitude updated in the model.

Adding a new row to the model using the '+' button opens an empty dialog with inputs for each column defined in the settings.

The default view is filterable by label.

The clear all button does exactly that - deletes all content and settings from the editor.

# Custom views - the good stuff
Tabulate includes the option to set a custom view for use in the add and edit dialogs. This allows more complex or larger data models to be displayed using a more intuitive UI as opposed to simply listing the properties as in the default dialog.

By including a custom view and associated controller, it's possible have data sourced from elsewhere in Umbraco. 

The dialogData.data object can be manipulated in the custom controller provided it is returned in the $scope.save function and maintains the correct column configuration as dictated by the editor configuration.

While the label formatter specified in the settings is reasonably robust, it can be more effective to build the label programmatically in the custom controller - this allows conditional labelling or inclusion of values that don't exist as part of the model. Storing the label as a model property (ie `customLabel`) allows it to then be referenced in the label setting as `{customLabel}`.

# Accessing the data
That's up to you. Make it available via a WebAPI endpoint and serve it up to a Javascript front-end, or map it to a model and use directly in your MVC views. The data is a JSON string, so can be readily transformed and manipulated.
