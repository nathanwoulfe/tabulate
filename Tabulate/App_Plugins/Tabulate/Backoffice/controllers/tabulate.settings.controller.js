(() => {

    function tabulateSettingsController($scope, $filter, tabulateResource, notificationsService, editorState) {

        const l = $scope.model.data !== undefined ? $scope.model.data.length : 0; // model data length
        const importKeys = []; // array of header text from imported csv

        /* variables for convenience */
        let geocoder = new google.maps.Geocoder(), // the google geocoder
            i, // loop counter
            j, // inner loop counter
            o, // generic object
            address; // address string for geocoding

        /* remove an existing column - need to handle data removal */
        $scope.model.columnsToRemove = [];

        this.removeColumn = $index => {
            if (confirm('Are you sure you want to remove this column?')) {
                $scope.model.columnsToRemove.push($index);
            }
        };

        this.types = tabulateResource.fieldTypes();

        /* store a copy of the config object for comparison when the modal is submitted */
        $scope.model.changes = [];
        const setInitial = () => {
            for (i = 0; i < $scope.model.config.columns.length; i += 1) {

                /* set default sort order if none exists */
                if (i === 0) {
                    if ($scope.model.config.columns[i].sortOrder === undefined) {
                        $scope.model.config.columns[i].sortOrder = 'A';
                    }
                }

                /* push copy into changes object */
                o = {};
                o.old = $scope.model.config.columns[i].displayName;
                $scope.model.changes.push(o);
            }
        };
        if ($scope.model.config.columns !== undefined && $scope.model.config.columns.length) {
            setInitial();

            // set a default label to the displayname of the first column
            if ($scope.model.config.label === '') {
                $scope.model.config.label = `{${$scope.model.config.columns[0].displayName}}`;
            }
         }

        /* when a column is updated, store the new name for comparison when the modal is submitted */
        this.changedColumn = columnIndex => {
            $scope.model.changes[columnIndex].newName = $scope.model.config.columns[columnIndex].displayName;
            $scope.model.changes[columnIndex].newType = $scope.model.config.columns[columnIndex].type;
        };

        /* by default, disable the import button, if there is data, display in the view */
        this.importDisabled = true;
        if ($scope.model.data) {
            this.importExport = JSON.stringify($scope.model);
        }

        /* set values for the mappings - can map to any other tabulate instance on the node */
        this.tabulateEditors = [];
        editorState.current.tabs.forEach(v => {
            v.properties.forEach(vv => {
                if ($scope.model.alias !== vv.alias && vv.editor === 'NW.Tabulate') {
                    this.tabulateEditors.push(vv);
                }
            });
        });

        this.setTargetEditorColumns = alias => {
            if (alias !== undefined) {
                this.tabulateEditors.forEach(v => {
                    if (v.alias === alias) {
                        this.targetEditorColumns = v.value.settings.columns;
                    }
                });
            }
        };

        /* add object to model */
        this.addEmptyItem = () => {
            if ($scope.model.config.mappings === undefined) {
                $scope.model.config.mappings = [];
            }

            $scope.model.config.mappings.push({});
        };

        /*  remove object from the model */
        this.removeMapping = index => {
            $scope.model.config.mappings.splice(index, 1);
        };

        this.populateItem = (index, mapping) => {
            $scope.model.config.mappings[index] = mapping;
        };

        /* display csv or json in the export textarea */
        this.showing = 'json';
        this.show = type => {
            if (type === 'csv') {
                this.importExport = tabulateResource.JSONtoCSV($scope.model.data, $scope.model.config.columns);
            } else {
                this.importExport = JSON.stringify($scope.model);
            }
            this.importDisabled = true;
            this.showing = type;
        };

        /* give two download options - raw json, or parsed csv */
        this.download = () => {

            const filename = `download.${this.showing}`,
                d = JSON.parse(JSON.stringify(this.importExport)); // we need a copy of the data, not a reference

            if (!navigator.userAgent.match(/msie|trident/i)) {
                const saving = document.createElement('a');
                saving.href = `data:attachment/${this.showing},${encodeURIComponent(d)}`;
                saving.download = filename;
                saving.click();
            } else {
                const blob = new Blob([d]);
                window.navigator.msSaveOrOpenBlob(blob, filename);
            }
        };

        /* if the importexport value changes, through a direct edit or pasting in a new csv display the import button */
        $scope.$watch(() => this.importExport, (newVal, oldVal) => {
            if (newVal !== oldVal && newVal.length === 0) {
                this.importDisabled = false;
            }
        });

        this.importJSON = () => {
            if (this.importExport.length) {
                try {
                    $scope.model = JSON.parse(this.importExport);
                } catch (e) {
                    alert('Invalid JSON input');
                }
            }
        };

        /* imports new data from csv */
        this.importCSV = () => {

            /* only proceed if user confirms - import will clear the existing model value */
            if (confirm('Importing will overwrite all existing data. Continue?') && this.importExport.length) {

                /* parse the csv and push into the data object, provided it is no longer than 250 records */
                const csvtojson = JSON.parse(csvToJson(this.importExport));
                if (csvtojson.length > 0 && csvtojson.length < 2510) {

                    $scope.model.data = csvtojson;

                    /* prompt for geocoding */
                    /* geocodeAddresses method recurses through the data model */
                    if (importKeys.indexOf('Address') !== -1) {
                        /* accepts seed index, alias for encoded address, alias for source property */
                        if (window.google.maps !== undefined) {
                            geocoder = new google.maps.Geocoder();
                            geocodeAddresses(0, '_Address', 'Address');
                        } else {
                            notificationsService.error('Error', 'Google maps API not available - geocoding failed');
                        }
                    }

                    /* clear the config array and update with the new keys from the csv */
                    $scope.model.config.columns = [];
                    for (i = 0; i < importKeys.length; i += 1) {
                        o = {};
                        o.displayName = importKeys[i];
                        o.type = 'string';
                        $scope.model.config.columns.push(o);
                    }

                    /* disable importing, set a flag for config changes and new data */
                    this.importExportDisabled = true;
                    $scope.model.configChanged = true;
                }
                else {
                    notificationsService.error('Error', 'Import failed - dataset must be between 1 and 250 records');
                }
            }
        };

        this.sort = () => {
            if ($scope.model.data !== null && $scope.model.config.sortOrder !== 'M') {
                $scope.model.data = $filter('orderBy')($scope.model.data, '_label', $scope.model.config.sortOrder === 'D' ? true : false);
            }
            $scope.model.configChanged = true;
        };

        /* use geocoder to convert address to latlng points */
        const geocodeAddresses = (index, geoStr, p) => {

            address = $scope.model.data[index];

            geocoder.geocode({ 'address': address[p] }, (results, status) => {
                /* if the geocoding was successful, add the location to the object, otherwise, set location as undefined to ensure key exists */
                if (status === google.maps.GeocoderStatus.OK) {
                    address[geoStr] = results[0].geometry.location;
                } else {
                    address[geoStr] = undefined;
                    notificationsService.error('Error', `Geocoding failed for address: ${address[p]}`);
                }

                /* recurse through the data object */
                if (index + 1 < l) {
                    geocodeAddresses(index + 1, geoStr, p);
                } else {
                    notificationsService.success('Success', 'Geocoding completed successfully');
                }
            });
        };

        /* helper function to convert CSV to JSON
           not part of tabulateResource as it needs to populate the import keys object  */
        const csvToJson = (csv) => {

            try {
                const array = tabulateResource.CSVtoArray(csv),
                    objArray = [];
                let key;

                for (i = 1; i < array.length; i += 1) {
                    objArray[i - 1] = {};
                    for (j = 0; j < array[0].length && j < array[i].length; j += 1) {
                        key = array[0][j];

                        if (importKeys.indexOf(key) === -1) {
                            importKeys.push(key);
                        }
                        objArray[i - 1][key] = array[i][j];
                    }
                }

                const json = JSON.stringify(objArray);
                return json.replace(/\},/g, '},\r\n');
            }
            catch (e) {
                noticationsService.error('Import error', e);
                return '';
            }
        };
    }

    angular.module('umbraco').controller('Tabulate.SettingsController', ['$scope', '$filter', 'tabulateResource', 'notificationsService', 'editorState', tabulateSettingsController]);
})();


