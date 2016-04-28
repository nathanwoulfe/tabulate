/*global angular, confirm*/
(function () {
    'use strict';

    var umbraco = angular.module('umbraco');
    umbraco.requires.push('ui.bootstrap');

    function tabulateController($scope, $filter, authResource, assetsService, dialogService, notificationsService, tabulateResource, tabulatePagingService) {

        // let's add a stylesheet to pretty it up     
        assetsService.loadCss("/App_Plugins/Tabulate/style.css");
        // hide the umbraco label
        $scope.model.hideLabel = $scope.model.config.wide !== undefined && $scope.model.config.wide;

        // these don't need to be scoped
        var data,
            settings,
            init,
            vm,
            dialogPath = $scope.model.config.customView || '../App_Plugins/Tabulate/views/dialog.html';

        // helper function to generate a model based on config values
        function emptyModel() {
            var empModel = {};
            angular.forEach(settings.columns, function (c) {
                empModel[c.displayName] = '';
            });
            empModel._id = data.length;

            return empModel;
        }

        // clear model
        function clearModel() {
            if (confirm('Do you really want to delete all data?')) {
                data = [];
                settings = [];
                vm.paging = {
                    items: [],
                    numPages: 1,
                    search: '',
                    currentPage: 1
                },

                $scope.model.value = undefined;
                updateUmbracoModel();
                init();
            }
        }

        // iterate the model data, assign each object an id
        function setIds() {
            angular.forEach(data, function (o, i) {
                o._id = i;
            });
        }

        // get/set the sort order for the model, apply sort filter if necessary
        // if sorting is manual, the order is unchanged
        function setSorting() {
            if (settings.sortOrder === undefined) {
                settings.sortOrder = 'A';
            } else if (settings.sortOrder === 'M') {
                settings.numPerPage = data.length;
                vm.manualSort = true;
            } else {
                data = $filter('orderBy')(data, '_label', settings.sortOrder === 'D' ? true : false);
            }
            updateUmbracoModel();
        }

        // remove a column from settings
        function removeColumn(col) {
            // if this is the last column, get confirmation first, then remove the column and model data
            // otherwise, remove the column if multiple remain
            if (settings.columns.length === 1 && confirm('Removing all columns will also delete all stored data. Continue?')) {
                settings = {
                    columns: [],
                    label: '',
                    numPerPage: 10
                };
                data = [];
                setPaging();
                vm.noConfig = true;
            }
            else if (settings.columns.length > 1) {

                var dataLabel = settings.columns[col].displayName;
                angular.forEach(data, function (item) {
                    if (item.hasOwnProperty(dataLabel)) {
                        delete item[dataLabel];
                    }
                });

                settings.columns.splice(col, 1);
            }
            updateUmbracoModel();
        }

        // update column names/types
        function updateColumns(changes) {
            // each change has a new and old value - only continue if new exists ie has been changed
            // i = counter for the outer loop
            // c = changes object for the loop iteration
            // j = counter for the inner loop
            // d = the data object for the inner loop iteration
            var i, c, j, d;
            for (i = 0; i < changes.length; i += 1) {
                c = changes[i];
                if (c.newName !== undefined) {
                    // check each value for old name, if it exists update to new
                    for (j = 0; j < data.length; j += 1) {
                        d = data[j];

                        // has a renamed column, needs updating
                        if (d.hasOwnProperty(c.old)) {
                            // add a new property using the old value, then delete the old property
                            d[c.newName] = d[c.old];
                            d.type = c.newType;
                            delete d[c.old];
                        }
                    }
                }
            }
        }

        // add new row
        function addRow() {
            dialogService.open({
                template: dialogPath,
                show: true,
                dialogData: { type: 'add', data: emptyModel(), config: settings },
                callback: function (resp) {

                    // geocode the response and add it to the model
                    var newItem = vm.mapsLoaded ? tabulateResource.geocode(resp.data) : resp.data;
                    newItem = tabulateResource.setLabels(newItem, true, settings.label);

                    data.push(newItem);
                    updateUmbracoModel();
                    setSorting();
                    setIds();
                    setPaging();
                }
            });
        }

        // edit existing row
        function editRow($index) {
            dialogService.open({
                template: dialogPath,
                show: true,
                dialogData: { type: 'edit', data: data[$index], config: settings },
                callback: function (resp) {
                    // if the response has a new address, geocode it
                    // then store the response in the model
                    resp.data = tabulateResource.setLabels(resp.data, true, settings.label);
                    data[$index] = resp.recode === true && vm.mapsLoaded ? tabulateResource.geocode(resp.data) : resp.data;

                    //This section handles disabling and enabling mappings linked to the selected external program or selected external institue 
                    //refer to https://jira.usc.edu.au/browse/WWW-2232
                    if (resp.remap !== undefined && resp.remap.length > 0 && settings.mappings && settings.mappings.length) {
                        tabulateResource.updateMappedEditor(resp, undefined, settings.mappings);
                    }
                    updateUmbracoModel();
                    setSorting();
                    setIds();
                    setPaging();
                }
            });
        }

        // remove existing row 
        function removeRow($index) {
            if (data.length) {
                if (confirm('Are you sure you want to remove this?')) {
                    data.splice($index, 1);
                    updateUmbracoModel();
                    setIds();
                    setPaging();
                }
            }
        }

        // disable existing row
        function disableRow($index) {
            var v = data[$index];
            v.disabled = v.disabled === undefined || v.disabled === false ? true : false;

            if (settings.mappings && settings.mappings.length) {
                tabulateResource.updateMappedEditor(undefined, v, settings.mappings);
            }
            updateUmbracoModel();
        }

        // update settings 
        function openSettings() {

            vm.search = '';

            dialogService.open({
                template: '../App_Plugins/Tabulate/views/settings.html',
                show: true,
                dialogData: { data: data, config: settings, alias: $scope.model.alias },
                callback: function (resp) {

                    data = resp.data;
                    settings = resp.config;

                    setSorting();
                    setIds();
                    setPaging();

                    // if the columnsToRemove array exists, remove each config row
                    if (resp.columnsToRemove.length > 0) {
                        angular.forEach(resp.columnsToRemove, function (col) {
                            removeColumn(col);
                        });
                    }

                    // changes object will exist if changes were made to column names
                    if (resp.changes !== undefined) {
                        updateColumns(resp.changes);
                    }

                    // if the config has been altered
                    if (resp.configChanged === true) {
                        notificationsService.success('Settings updated', 'Don\'t forget to save your changes');
                    }

                    // better force the labels to be reset - not always apparent from checking config changes
                    data = tabulateResource.setLabels(data, true, settings.label);

                    // finally, if there's nothing left in the config, set the noConfig state
                    vm.noConfig = settings === undefined ? true : false;

                    // need to do this explicitly as it may be imported content
                    updateUmbracoModel();
                }
            });
        }

        // this is simply for convienence - update data/settings rather than $scope.model.value.data
        // need to remember though to call it whenever the data or settings objects are modified
        function updateUmbracoModel() {
            $scope.model.value.data = data;
            $scope.model.value.settings = settings;
        }

        // get the page from the paging service
        function setPaging() {
            vm.paging = tabulatePagingService.updatePaging(data, vm.paging.search, vm.paging.currentPage, settings.numPerPage);
            vm.noResults = (vm.paging.items.length === 0 && data.length) ? true : false;
        }

        // next/previous page
        function page(n) {
            vm.paging.currentPage = tabulatePagingService.setCurrentPage(vm.paging.currentPage, n ? vm.paging.numPages : undefined);
            setPaging();
        }

        // get the google map api
        (function loadGoogleMaps() {
            tabulateResource.loadGoogleMaps()
                .then(function (data) {
                    vm.mapsLoaded = data;
                });
        }());

        // should the author see the settings button?
        (function checkAuthorAccess() {
            authResource.getCurrentUser()
                .then(function (resp) {
                    vm.hideSettings = resp.userType === 'author' && !vm.config.adminOnly;
                });
        }());

        // EXPORT IT
        // needs the vm assignment as properties need to be accessed in other functions, where this = window
        vm = angular.extend(this, {
            // props
            manualSort: false,
            paging: {
                items: [],
                numPages: 1,
                search: '',
                currentPage: 1
            },
            noConfig: true,
            sortOptions: {
                axis: 'y',
                cursor: "move",
                handle: ".sort-btn",
                stop: function (ev, ui) {
                    $scope.model.value.data = data = vm.paging.items;
                    setIds();
                }
            },

            // functions
            page: page,
            addRow: addRow,
            editRow: editRow,
            removeRow: removeRow,
            disableRow: disableRow,
            clearModel: clearModel,
            openSettings: openSettings,
            setPaging: setPaging
        });

        /////////////////////////////////
        // kick the whole thing off... //
        /////////////////////////////////
        init = (function doInit() {
            if ($scope.model.value === undefined || $scope.model.value.length === 0) {
                $scope.model.value = {
                    settings: {
                        columns: [],
                        label: '',
                        numPerPage: 10
                    },
                    data: []
                };
                data = $scope.model.value.data;
                settings = $scope.model.value.settings;
            }
            else if ($scope.model.value.settings !== undefined) {
                data = $scope.model.value.data;
                settings = $scope.model.value.settings;
                vm.noConfig = false;

                if (data !== null && data !== undefined) {
                    setSorting();
                    setIds();
                    setPaging();
                }
            }
            return doInit;
        })();
    }

    umbraco.controller('Tabulate.Controller', ['$scope', '$filter', 'authResource', 'assetsService', 'dialogService', 'notificationsService', 'tabulateResource', 'tabulatePagingService', tabulateController]);

})();
