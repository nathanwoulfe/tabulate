export class TabulateSettingsController {

    static name = 'Tabulate.Settings.Controller';

    constructor($scope, $filter, tabulateResource, notificationsService, overlayService) {
        this.$scope = $scope;
        this.$filter = $filter;
        this.tabulateResource = tabulateResource;
        this.noticationsService = notificationsService;
        this.overlayService = overlayService;

        this.importKeys = []; // array of header text from imported csv
        this.geocoder;

        this.types = tabulateResource.fieldTypes();
        this.importDisabled = true;
        this.showing = 'json';

        this.$scope.model.columnsToRemove = []; // remove an existing column - need to handle data removal
        this.$scope.model.changes = []; // store a copy of the config object for comparison when the modal is submitted

        if (this.$scope.model.config.columns && this.$scope.model.config.columns.length) {
            for (let i = 0; i < this.$scope.model.config.columns.length; i += 1) {

                /* set default sort order if none exists */
                if (i === 0 && this.$scope.model.config.columns[i].sortOrder) {
                    this.$scope.model.config.columns[i].sortOrder = 'A';
                }

                /* push copy into changes object */
                this.$scope.model.changes.push({
                    old: this.$scope.model.config.columns[i].displayName
                });
            }

            // set a default label to the display name of the first column
            if (this.$scope.model.config.label === '') {
                this.$scope.model.config.label = `{${this.$scope.model.config.columns[0].displayName}}`;
            }
        }

        /* by default, disable the import button, if there is data, display in the view */
        if (this.$scope.model.data) {
            this.importExport = JSON.stringify(this.$scope.model);
        }

        /**
         * if the importexport value changes, through a direct edit or pasting in a new csv display the import button
         */
        this.watchImportExport = this.$scope.$watch(() => this.importExport, (newVal, oldVal) => {
            if (newVal !== oldVal && newVal.length === 0) {
                this.importDisabled = false;
            }
        });
    }

    $onDestroy = () => {
        this.watchImportExport();
    }

    /**
     * when a column is updated, store the new name for comparison when the modal is submitted
     * @param {int} columnIndex => the column being updated
     */
    changedColumn = columnIndex => {
        this.$scope.model.changes[columnIndex].newName = this.$scope.model.config.columns[columnIndex].displayName;
        this.$scope.model.changes[columnIndex].newType = this.$scope.model.config.columns[columnIndex].type;
    }

    // todo => how would this be managed with variants?
    /* set values for the mappings - can map to any other tabulate instance on the node */
    //this.tabulateEditors = [];
    //editorState.current.tabs.forEach(v => {
    //    v.properties.forEach(vv => {
    //        if ($scope.model.alias !== vv.alias && vv.editor === 'NW.Tabulate') {
    //            this.tabulateEditors.push(vv);
    //        }
    //    });
    //});

    //this.setTargetEditorColumns = alias => {
    //    if (alias !== undefined) {
    //        this.tabulateEditors.forEach(v => {
    //            if (v.alias === alias) {
    //                this.targetEditorColumns = v.value.settings.columns;
    //            }
    //        });
    //    }
    //};

    /* add object to model */
    //this.addEmptyItem = () => {
    //    if ($scope.model.config.mappings === undefined) {
    //        $scope.model.config.mappings = [];
    //    }

    //    $scope.model.config.mappings.push({});
    //};

    //*  remove object from the model */
    //this.removeMapping = index => {
    //    $scope.model.config.mappings.splice(index, 1);
    //};

    //this.populateItem = (index, mapping) => {
    //    $scope.model.config.mappings[index] = mapping;
    //};


    /**
     * display csv or json in the export textarea
     * @param {string} type => json or csv
     */
    show = type => {
        this.importExport = type === 'csv'
            ? this.tabulateResource.JSONtoCSV(this.$scope.model.data, this.$scope.model.config.columns)
            : JSON.stringify(this.$scope.model);

        this.importDisabled = true;
        this.showing = type;
    }

    /**
     * was a column added? add to the collection if so
     */
    addColumn = () => {
        this.$scope.model.config.columns.push({
            displayName: this.newColumnName,
            type: this.newColumnType
        });

        this.newColumnName = null;
        this.newColumnType = null;
    }

    /**
     * Removes a column from the config.columns array, data is removed in the controller on submit
     * @param {any} i => the index of the column to remove
     */
    removeColumn = i => {
        this.overlayService.confirm({
            confirmMessage: 'Are you sure you want to remove this column?',
            hideHeader: true,
            submit: () => {
                this.$scope.model.columnsToRemove.push(i); // data is removed on submit
                this.$scope.model.config.columns.splice(i); // remove it from the current columns list

                this.overlayService.close();
            },
            close: () => this.overlayService.close()
        });
    }


    /**
     * give two download options - raw json, or parsed csv
     */
    download = () => {

        const filename = `download.${this.showing}`;
        const d = JSON.parse(JSON.stringify(this.importExport)); // we need a copy of the data, not a reference

        if (!navigator.userAgent.match(/msie|trident/i)) {
            const saving = document.createElement('a');

            saving.href = `data:attachment/${this.showing},${encodeURIComponent(d)}`;
            saving.download = filename;
            saving.click();
        } else {
            const blob = new Blob([d]);
            window.navigator.msSaveOrOpenBlob(blob, filename);
        }
    }


    /**
     * helper function to convert CSV to JSON - not part of tabulateResource as it needs to populate the import keys object
     * @param {any} csv => the string to convert
     * @returns {object} => the resulting JSON object
     */
    convertCsvToJson = csv => {

        try {
            const array = this.tabulateResource.CSVtoArray(csv);
            const objArray = [];
            let key;

            for (let i = 1; i < array.length; i += 1) {
                objArray[i - 1] = {};
                for (let j = 0; j < array[0].length && j < array[i].length; j += 1) {
                    key = array[0][j];

                    if (!this.importKeys.includes(key)) {
                        this.importKeys.push(key);
                    }
                    objArray[i - 1][key] = array[i][j];
                }
            }

            const json = JSON.stringify(objArray);

            return json.replace(/\},/g, '},\r\n');
        }
        catch (e) {
            this.noticationsService.error('Import error', e);
            return '';
        }
    }


    /**
     * use geocoder to convert address to lat lng points
     * @param {any} index => which item is being updated?
     * @param {any} geoStr => alias for encoded
     * @param {any} p => alias for source
     */
    geocodeAddresses = (index, geoStr, p) => {

        const address = this.$scope.model.data[index];

        this.geocoder.geocode({ 'address': address[p] }, (results, status) => {
            /* if the geocoding was successful, add the location to the object, otherwise, set location as undefined to ensure key exists */
            if (status === google.maps.GeocoderStatus.OK) {
                address[geoStr] = results[0].geometry.location;
            } else {
                address[geoStr] = undefined;
                this.notificationsService.error('Error', `Geocoding failed for address: ${address[p]}`);
            }

            /* recurse through the data object */
            if (index + 1 < l) {
                this.geocodeAddresses(index + 1, geoStr, p);
            } else {
                this.notificationsService.success('Success', 'Geocoding completed successfully');
            }
        });
    }


    /**
     * imports new data from csv
     */
    importCsv = () => {

        /* import will clear the existing model value */
        if (this.importExport.length) {
            this.overlayService.confirm({
                confirmMessage: 'Importing will overwrite all existing data. Continue?',
                hideHeader: true,
                submit: _ => {
                    this.doImportCsv();
                    this.overlayService.close();
                },
                close: () => this.overlayService.close()
            });
        }
    }

    /**
     * 
     * */
    doImportCsv = () => {
        /* parse the csv and push into the data object, provided it is no longer than 250 records */
        const csvToJson = JSON.parse(this.convertCsvToJson(this.importExport));
        if (csvToJson.length > 0 && csvToJson.length < 2510) {

            this.$scope.model.data = csvToJson;

            /* prompt for geocoding */
            /* geocodeAddresses method recurses through the data model */
            if (this.importKeys.includes('Address')) {

                /* accepts seed index, alias for encoded address, alias for source property */
                if (window.google.maps) {
                    this.geocoder = new google.maps.Geocoder();
                    this.geocodeAddresses(0, '_Address', 'Address');
                } else {
                    this.notificationsService.error('Error', 'Google maps API not available - geocoding failed');
                }
            }

            /* clear the config array and update with the new keys from the csv */
            this.$scope.model.config.columns = [];
            for (let key of this.importKeys) {
                this.$scope.model.config.columns.push({
                    displayName: key,
                    type: 'string'
                });
            }

            /* disable importing, set a flag for config changes and new data */
            this.importExportDisabled = true;
            this.$scope.model.configChanged = true;
        }
        else {
            this.notificationsService.error('Error', 'Import failed - dataset must be between 1 and 250 records');
        }
    }

    /**
     * Import the pasted data into the current model
     */
    import = () => {
        if (this.importExport[0] === '{') {
            try {
                this.$scope.model = JSON.parse(this.importExport);
            } catch (e) {
                alert('Invalid JSON input');
            }
        } else {
            this.importCsv();
        }
    }

    /**
     *
     */
    sort = () => {
        if (this.$scope.model.data && this.$scope.model.config.sortOrder !== 'M') {
            this.$scope.model.data = this.$filter('orderBy')(this.$scope.model.data, '_label', this.$scope.model.config.sortOrder === 'D');
        }
        this.$scope.model.configChanged = true;
    }

}
