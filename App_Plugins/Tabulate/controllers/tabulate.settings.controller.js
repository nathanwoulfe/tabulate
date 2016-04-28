/*global angular, google, confirm*/
/*jslint nomen: true*/
(function () {
    'use strict';

    function tabulateSettingsController($scope, $filter, tabulateResource, notificationsService, editorState) {

        /* variables for convenience */
        var importedNew = false, // flag to pass back to editor indicating new csv import
            geocoder = new google.maps.Geocoder(), // the google geocoder
            hasChanges = false, // flag to pass back to editor indicating changes to the config
            l = $scope.dialogData.data !== undefined ? $scope.dialogData.data.length : 0, // model data length
            i, // loop counter
            j, // inner loop counter
            o, // generic object
            address, // address string for geocoding
            importKeys = [], // array of header text from imported csv
            setInitial,
            geocodeAddresses,
            csvToJson;

        /* remove an existing column - need to handle data removal */
        $scope.dialogData.columnsToRemove = [];
        $scope.removeColumn = function ($index) {
            if (confirm('Are you sure you want to remove this column?')) {
                $scope.dialogData.columnsToRemove.push($index);
            }
        };

        /* store a copy of the config object for comparison when the modal is submitted */
        $scope.changes = [];
        setInitial = function () {
            for (i = 0; i < $scope.dialogData.config.columns.length; i += 1) {

                /* set default sort order if none exists */
                if (i === 0) {
                    if ($scope.dialogData.config.columns[i].sortOrder === undefined) {
                        $scope.dialogData.config.columns[i].sortOrder = 'A';
                    }
                }

                /* push copy into changes object */
                o = {};
                o.old = $scope.dialogData.config.columns[i].displayName;
                $scope.changes.push(o);
            }
        };
        if ($scope.dialogData.config.columns !== undefined && $scope.dialogData.config.columns.length) {
            setInitial();
        }

        /* when a column is updated, store the new name for comparison when the modal is submitted */
        $scope.changedColumn = function (i) {
            $scope.changes[i].newName = $scope.dialogData.config.columns[i].displayName;
            $scope.changes[i].newType = $scope.dialogData.config.columns[i].type;
            hasChanges = true;
        };

        /* by default, disable the import button, if there is data, display in the view */
        $scope.importDisabled = true;
        if ($scope.dialogData.data) {
            $scope.importExport = JSON.stringify($scope.dialogData);
        }

        /* set values for the mappings - can map to any other tabulate instance on the node */
        $scope.tabulateEditors = [];
        angular.forEach(editorState.current.tabs, function (v, i) {
            angular.forEach(v.properties, function (vv, ii) {
                if ($scope.dialogData.alias !== vv.alias && vv.editor === 'NW.Tabulate') {
                    $scope.tabulateEditors.push(vv);
                }
            });
        });

        $scope.setTargetEditorColumns = function (alias) {
            if (alias !== undefined) {
                angular.forEach($scope.tabulateEditors, function (v, i) {
                    if (v.alias === alias) {
                        $scope.targetEditorColumns = v.value.settings.columns;
                    }
                });
            }
        }

        /* add object to dialogData */
        $scope.addEmptyItem = function (p) {
            if ($scope.dialogData.config.mappings === undefined) {
                $scope.dialogData.config.mappings = [];
            }

            $scope.dialogData.config.mappings.push({});
        };

        /*  remove object from the dialogData */
        $scope.removeMapping = function (index, p) {
            $scope.dialogData.config.mappings.splice(index, 1);
        };

        $scope.populateItem = function (i, c) {
            $scope.dialogData.config.mappings[i] = c;
        };

        /* display csv or json in the export textarea */
        $scope.showing = 'json';
        $scope.show = function (type) {
            if (type === 'csv') {
                $scope.importExport = tabulateResource.JSONtoCSV($scope.dialogData.data, $scope.dialogData.config.columns);
            } else {
                $scope.importExport = JSON.stringify($scope.dialogData);
            }
            $scope.importDisabled = true;
            $scope.showing = type;
        };

        /* give two download options - raw json, or parsed csv */
        $scope.download = function () {

            var filename = 'download.' + $scope.showing,
                d = JSON.parse(JSON.stringify($scope.importExport)); // we need a copy of the data, not a reference

            if (!navigator.userAgent.match(/msie|trident/i)) {
                var saving = document.createElement('a');
                saving.href = 'data:attachment/' + $scope.showing + ',' + encodeURIComponent(d);
                saving.download = filename;
                saving.click();
            } else {
                var blob = new Blob([d]);
                window.navigator.msSaveOrOpenBlob(blob, filename);
            }
        };

        /* if the importexport value changes, through a direct edit or pasting in a new csv display the import button */
        $scope.$watch('importExport', function (newVal, oldVal) {
            if (newVal !== oldVal && newVal.length === 0) {
                $scope.importDisabled = false;
            }
        });

        $scope.importJSON = function () {
            if ($scope.importExport.length) {
                try {
                    $scope.dialogData = JSON.parse($scope.importExport);
                } catch (e) {
                    alert('Invalid JSON input');
                }
            }
        };

        /* imports new data from csv */
        $scope.importCSV = function () {

            /* only proceed if user confirms - import will clear the existing model value */
            if (confirm('Importing will overwrite all existing data. Continue?') && $scope.importExport.length) {

                /* parse the csv and push into the data object, provided it is no longer than 250 records */
                var csvtojson = JSON.parse(csvToJson($scope.importExport));
                if (csvtojson.length > 0 && csvtojson.length < 2510) {

                    $scope.dialogData.data = csvtojson;

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
                    $scope.dialogData.config.columns = [];
                    for (i = 0; i < importKeys.length; i += 1) {
                        o = {};
                        o.displayName = importKeys[i];
                        o.type = 'string';
                        $scope.dialogData.config.columns.push(o);
                    }

                    /* disable importing, set a flag for config changes and new data */
                    $scope.importExportDisabled = true;
                    $scope.dialogData.configChanged = true;
                    importedNew = true;

                    isCreditImport();
                }
                else {
                    notificationsService.error('Error', 'Import failed - dataset must be between 1 and 250 records');
                }
            }
        };

        $scope.sort = function () {
            if ($scope.dialogData.data !== null && $scope.dialogData.config.sortOrder !== 'M') {
                $scope.dialogData.data = $filter('orderBy')($scope.dialogData.data, '_label', $scope.dialogData.config.sortOrder === 'D' ? true : false);
            }
            $scope.dialogData.configChanged = true;
        };

        /* use geocoder to convert address to latlng points */
        geocodeAddresses = function (index, geoStr, p) {

            address = $scope.dialogData.data[index];

            geocoder.geocode({ 'address': address[p] }, function (results, status) {
                /* if the geocoding was successful, add the location to the object, otherwise, set location as undefined to ensure key exists */
                if (status === google.maps.GeocoderStatus.OK) {
                    address[geoStr] = results[0].geometry.location;
                } else {
                    address[geoStr] = undefined;
                    notificationsService.error('Error', 'Geocoding failed for address: ' + address[p]);
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
        csvToJson = function (csv) {

            try {
                var array = tabulateResource.CSVtoArray(csv),
                    objArray = [],
                    json,
                    str,
                    key;

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

                json = JSON.stringify(objArray);
                str = json.replace(/\},/g, "},\r\n");

                return str;
            }
            catch (e) {
                noticationsService.error('Import error', e);
                return '';
            }
        };

        /* save and close, sending back updated config model */
        $scope.save = function () {

            /* if the newColumnName flag has been set, add the column object into the config object */
            if ($scope.newColumnName !== undefined) {
                $scope.dialogData.config.columns.push({
                    displayName: $scope.newColumnName,
                    type: $scope.newColumnType
                });
                $scope.dialogData.configChanged = true;
            }

            /* also return changes to existing columns, if any */
            if (hasChanges) {
                $scope.dialogData.changes = $scope.changes;
                $scope.dialogData.configChanged = true;
            }

            /* not all values are worth keeping - especially the value of the mapped editor
               keeping the value can also have unwanted side-effects, like deleting the data set */
            if ($scope.dialogData.config && $scope.dialogData.config.mappings) {
                angular.forEach($scope.dialogData.config.mappings, function (v, i) {
                    v.targetEditor = {
                        alias: v.targetEditor.alias,
                        label: v.targetEditor.label,
                        config: v.targetEditor.config
                    };
                });
            }

            /* send it on back to the editor controller */
            $scope.submit($scope.dialogData);
        };
    }

    angular.module('umbraco').controller('Tabulate.SettingsController', ['$scope', '$filter', 'tabulateResource', 'notificationsService', 'editorState', tabulateSettingsController]);
})();


