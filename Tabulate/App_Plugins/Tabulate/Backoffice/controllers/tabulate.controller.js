(() => {

    function tabulateController($scope, $q, $filter, authResource, assetsService, dialogService, notificationsService, tabulateResource, tabulatePagingService) {

        const basePath = '../app_plugins/tabulate/backoffice/';
        const dialogPath = $scope.model.config.customView || `${basePath}views/dialog.html`;

        // let's add a stylesheet to pretty it up     
        assetsService.loadCss(`${basePath}style.min.css`);

        // hide the umbraco label if the view is set to wide
        $scope.model.hideLabel = $scope.model.config.wide !== undefined && $scope.model.config.wide;
        const rteConfig = $scope.model.config.rte;

        // these don't need to be scoped
        let data,
            settings;

        const pathArray = dialogPath.split('/');
        const fileName = pathArray[pathArray.length - 1];
        const className = fileName.substr(0, fileName.indexOf('.')) + '-modal';

        // this is simply for convienence - update data/settings rather than $scope.model.value.data
        // need to remember though to call it whenever the data or settings objects are modified
        const updateUmbracoModel = () => {
            $scope.model.value.data = data;
            $scope.model.value.settings = settings;
        };

        // helper function to generate a model based on config values
        const emptyModel = () => {
            var newModel = {};
            settings.columns.forEach(c => {
                newModel[c.displayName] = '';
            });
            newModel._id = data.length;

            return newModel;
        };

        // clear model
        const clearModel = () => {
            if (confirm('Do you really want to delete all data?')) {
                data = [];
                settings = [];
                this.pagination = {
                    items: [],
                    currentPage: 1,
                    search: '',
                    pageNumber: 1,
                    pageIndex: 0
                };

                $scope.model.value = undefined;
                init();
            }
        };

        // iterate the model data, assign each object an id
        const setIds = () => {
            data.forEach((o, i) => {
                o._id = i;
            });
        };

        // get/set the sort order for the model, apply sort filter if necessary
        // if sorting is manual, the order is unchanged
        const setSorting = () => {
            this.manualSort = false;

            if (settings.sortOrder === undefined) {
                settings.sortOrder = 'A';
            } else if (settings.sortOrder === 'M') {
                settings.numPerPage = data.length;
                this.manualSort = true;
            } else {
                data = $filter('orderBy')(data, '_label', settings.sortOrder === 'D' ? true : false);
            }

            updateUmbracoModel();
        };

        // remove a column from settings
        const removeColumn = col => {
            // if this is the last column, get confirmation first, then remove the column and model data
            // otherwise, remove the column if multiple remain
            if (settings.columns.length === 1 && confirm('Removing all columns will also delete all stored data. Continue?')) {
                settings = {
                    columns: [],
                    label: '',
                    isListView: false,
                    numPerPage: 10
                };
                data = [];
                setPaging();
                this.noConfig = true;
            }
            else if (settings.columns.length > 1) {

                var dataLabel = settings.columns[col].displayName;
                data.forEach(item => {
                    if (item.hasOwnProperty(dataLabel)) {
                        delete item[dataLabel];
                    }
                });

                settings.columns.splice(col, 1);
            }
            updateUmbracoModel();
        };

        // update column names/types
        const updateColumns = changes => {
            // each change has a new and old value - only continue if new exists ie has been changed
            // i = counter for the outer loop
            // c = changes object for the loop iteration
            // j = counter for the inner loop
            // d = the data object for the inner loop iteration
            let i, c, j, d;
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
        };

        /**
         * Close and clear the overlay
         */
        const closeOverlay = () => {
            this.overlay.show = false;
            this.overlay = null;
        };

        /**
         * Open the overlay to add a new row
         */
        const addRow = () => {

            this.overlay = {
                view: dialogPath,
                modalClass: `tabulate-modal ${className}`,
                show: true,
                title: 'Add row',
                hideSubmitButton: false,
                type: 'add',
                data: emptyModel(),
                config: settings,
                rteConfig: rteConfig,
                submit: resp => {
                    closeOverlay();

                    // get the value from rte fields, if any exist
                    const rteKeys = Object.keys(resp.rte);

                    if (rteKeys.length) {
                        for (let i = 0; i < rteKeys.length; i += 1) {
                            resp.data[rteKeys[i]] = resp.rte[rteKeys[i]].value;
                        }
                    }

                    // geocode the response and add it to the model
                    let newItem = this.mapsLoaded ? tabulateResource.geocode(resp.data) : resp.data;
                    newItem = tabulateResource.setLabels(newItem, true, settings.label);

                    data.push(newItem);

                    updateUmbracoModel();

                    setSorting();
                    setIds();
                    setPaging();
                },
                close: () => {
                    closeOverlay();
                }
            };
        };

        /**
         * Open the overlay to edit an existing row
         * @param {any} $index
         */
        const editRow = $index => {
            this.overlay = {
                view: dialogPath,
                modalClass: `tabulate-modal ${className}`,
                show: true,
                hideSubmitButton: false,
                title: 'Edit row',
                type: 'edit',
                data: data[$index],
                config: settings,
                rteConfig: rteConfig,
                submit: resp => {
                    closeOverlay();

                    // get the value from rte fields, if any exist
                    const rteKeys = Object.keys(resp.rte);

                    if (rteKeys.length) {
                        for (let i = 0; i < rteKeys.length; i += 1) {
                            resp.data[rteKeys[i]] = resp.rte[rteKeys[i]].value;
                        }
                    }

                    // if the response has a new address, geocode it
                    // then store the response in the model
                    resp.data = tabulateResource.setLabels(resp.data, true, settings.label);
                    data[$index] = resp.recode === true && this.mapsLoaded ? tabulateResource.geocode(resp.data) : resp.data;

                    if (resp.remap !== undefined &&
                        resp.remap.length > 0 &&
                        settings.mappings &&
                        settings.mappings.length) {
                        tabulateResource.updateMappedEditor(resp, undefined, settings.mappings);
                    }

                    updateUmbracoModel();

                    setSorting();
                    setIds();
                    setPaging();
                },
                close: () => {
                    closeOverlay();
                }
            };
        };

        /**
         * Remove an existing row from the collection
         * @param {any} $index
         */
        const removeRow = $index => {
            if (data.length && confirm('Are you sure you want to remove this?')) {
                data.splice($index, 1);

                updateUmbracoModel();
                setIds();
                setPaging();
            }
        };

        /**
         * Set the disabled state for the selected row
         * @param {any} $index
         */
        const disableRow = $index => {
            const v = data[$index];
            v.disabled = v.disabled === undefined || v.disabled === false ? true : false;

            if (settings.mappings && settings.mappings.length) {
                tabulateResource.updateMappedEditor(undefined, v, settings.mappings);
            }
            updateUmbracoModel();
        }

        /**
         * Open  the settings overlay
         */
        const openSettings = () => {

            this.search = '';

            this.overlay = {
                view: `${basePath}views/settings.html`,
                modalClass: `umb-modal tabulate-modal ${className}`,
                show: true,
                title: 'Settings',
                data: data,
                config: settings,
                alias: $scope.model.alias,
                submit: resp => {
                    closeOverlay();

                    data = resp.data;

                    setSorting();
                    setIds();
                    setPaging();

                    // was a column added? add to the collection if so
                    if (resp.newColumnName && resp.newColumnType) {
                        settings.columns.push({
                            displayName: resp.newColumnName,
                            type: resp.newColumnType
                        });
                    }

                    // if the columnsToRemove array exists, remove each config row
                    if (resp.columnsToRemove.length > 0) {
                        angular.forEach(resp.columnsToRemove,
                            col => {
                                removeColumn(col);
                            });
                    }

                    // changes object will exist if changes were made to column names
                    if (resp.changes && resp.changes.length) {
                        updateColumns(resp.changes);
                    }

                    // if the config has been altered
                    if (resp.changes && resp.changes.length || resp.newColumnName || resp.configChanged) {
                        notificationsService.success('Settings updated', 'Don\'t forget to save your changes');
                    }

                    // better force the labels to be reset - not always apparent from checking config changes
                    data = tabulateResource.setLabels(data, true, settings.label);

                    // finally, if there's nothing left in the config, set the noConfig state
                    this.noConfig = settings === undefined ? true : false;

                    // need to do this explicitly as it may be imported content
                    updateUmbracoModel();
                },
                close: () => {
                    closeOverlay();
                }
            };
        };

        /**
         * 
         * @param {any} pageNumber
         */
        const goToPage = pageNumber => {
            this.pagination.pageIndex = pageNumber - 1;
            this.pagination.pageNumber = pageNumber;

            setPaging();
        };
        
        /**
         * get the page from the paging service
         */
        const setPaging = () => {
            this.pagination = tabulatePagingService.updatePaging(data,
                this.pagination.search,
                this.pagination.pageNumber,
                settings.numPerPage);
            this.noResults = this.pagination.items.length === 0 && data.length ? true : false;
        };

        angular.extend(this, {
            // props
            manualSort: false,
            hideSettings: true,
            pagination: {
                items: [],
                totalPages: 1,
                search: '',
                pageNumber: 1,
                pageIndex: 0 
            },
            noConfig: true,
            sortOptions: {
                axis: 'y',
                cursor: 'move',
                handle: '.sort-handle',
                stop: () => {
                    $scope.model.value.data = data = this.pagination.items;
                    setIds();
                }
            },

            // functions
            addRow: addRow,
            editRow: editRow,
            removeRow: removeRow,
            disableRow: disableRow,
            clearModel: clearModel,
            openSettings: openSettings,
            setPaging: setPaging,
            goToPage: goToPage
        });

        /////////////////////////////////
        // kick the whole thing off... //
        /////////////////////////////////
        const init = () => {
            if ($scope.model.value === undefined || $scope.model.value.length === 0) {
                $scope.model.value = {
                    settings: {
                        columns: [],
                        label: '',
                        islistView: false,
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

                this.noConfig = false;

                if (data) {
                    setSorting();
                    setIds();
                    setPaging();
                }
            }
        };

        const promises = [
            tabulateResource.loadGoogleMaps($scope.model.config.mapsApiKey), authResource.getCurrentUser()
        ];

        $q.all(promises)
            .then(resp => {
                this.mapsLoaded = resp[0];
                this.hideSettings = resp[1].userGroups.indexOf('admin') === -1 && $scope.model.config.adminOnly;

                init();
            });
    }

    angular.module('umbraco').controller('Tabulate.Controller', ['$scope', '$q', '$filter', 'authResource', 'assetsService', 'dialogService', 'notificationsService', 'tabulateResource', 'tabulatePagingService', tabulateController]);

})();
