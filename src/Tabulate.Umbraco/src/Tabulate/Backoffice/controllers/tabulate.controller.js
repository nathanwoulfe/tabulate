import { v4 as uuidv4 } from 'uuid';

export class TabulateController {

    static name = 'Tabulate.Controller';

    constructor($scope, $q, $filter, editorState, authResource, notificationsService, editorService, overlayService, tabulateResource, tabulatePagingService) {
        this.$scope = $scope;
        this.$filter = $filter;
        this.editorState = editorState;
        this.authResource = authResource;
        this.notificationsService = notificationsService;
        this.editorService = editorService;
        this.overlayService = overlayService;
        this.tabulateResource = tabulateResource;
        this.tabulatePagingService = tabulatePagingService;

        this.basePath = Umbraco.Sys.ServerVariables.umbracoSettings.appPluginsPath + '/Tabulate/Backoffice';
        this.dialogPath = $scope.model.config.customView || `${this.basePath}/overlays/dialog.html`;
        this.viewSize = $scope.model.config.customView ? $scope.model.config.overlaySize : 'small';

        // hide the umbraco label if the view is set to wide
        this.$scope.model.hideLabel = $scope.model.config.wide == true;
        this.rteConfig = $scope.model.config.rte;

        // these don't need to be scoped
        this.data;
        this.settings;

        this.manualSort = false;
        this.hideSettings = true;
        this.pagination = {
            items: [],
            totalPages: 1,
            search: '',
            pageNumber: 1,
            pageIndex: 0
        };

        this.sortOptions = {
            axis: 'y',
            cursor: 'move',
            handle: '.sort-handle',
            stop: () => {
                this.$scope.model.value.data = this.data = this.pagination.items;
            }
        };

        const promises = [
            tabulateResource.loadGoogleMaps($scope.model.config.mapsApiKey),
            authResource.getCurrentUser()
        ];

        this.loading = true;
        $q.all(promises)
            .then(resp => {
                this.mapsLoaded = resp[0];
                if ($scope.model.config.canAccessSettings) {
                    const canAccessSettings = $scope.model.config.canAccessSettings.split(',');
                    this.hideSettings = !resp[1].userGroups.some(x => canAccessSettings.includes(x));
                } else {
                    this.hideSettings = false;
                }

                this.init();
            });
    }

    // this is simply for convenience - update data/settings rather than $scope.model.value.data
    // need to remember though to call it whenever the data or settings objects are modified
    updateUmbracoModel = () => {
        this.$scope.model.value.data = this.data;
        this.$scope.model.value.settings = this.settings;
    };

    // helper function to generate a model based on config values
    emptyModel = () => {
        let newModel = {
            _guid: uuidv4()
        };

        this.settings.columns.forEach(c => {
            newModel[c.displayName] = '';
        });

        return newModel;
    };

    // clear model
    clearModel = () => {

        this.overlayService.confirmDelete({
            confirmMessage: 'Do you really want to delete all data?',
            hideHeader: true,
            submit: () => {
                this.data = [];
                this.settings = [];
                this.pagination = {
                    items: [],
                    currentPage: 1,
                    search: '',
                    pageNumber: 1,
                    pageIndex: 0
                };

                this.$scope.model.value = [];
                this.init();

                this.overlayService.close();
            },
            close: () => this.overlayService.close()
        });
    };


    // get/set the sort order for the model, apply sort filter if necessary
    // if sorting is manual, the order is unchanged
    setSorting = () => {
        this.manualSort = false;

        if (!this.settings.sortOrder) {
            this.settings.sortOrder = 'A';
        } else if (this.settings.sortOrder === 'M') {
            this.settings.numPerPage = this.data.length;
            this.manualSort = true;
        } else {
            this.data = this.$filter('orderBy')(this.data, '_label', this.settings.sortOrder === 'D');
        }

        this.updateUmbracoModel();
    };

    // remove a column from settings
    removeColumn = col => {
        // if this is the last column, get confirmation first, then remove the column and model data
        // otherwise, remove the column if multiple remain
        if (this.settings.columns.length === 1) {

            this.overlayService.confirm({
                confirmMessage: 'Removing all columns will also delete all stored data. Continue?',
                hideHeader: true,
                submit: () => {
                    this.settings = {
                        columns: [],
                        label: '',
                        isListView: false,
                        numPerPage: 10
                    };
                    this.data = [];
                    this.setPaging();
                    this.noConfig = true;

                    this.overlayService.close();
                },
                close: () => this.overlayService.close()
            });
        }
        else if (this.settings.columns.length > 1) {

            var dataLabel = this.settings.columns[col].displayName;
            this.data.forEach(item => {
                if (item.hasOwnProperty(dataLabel)) {
                    delete item[dataLabel];
                }
            });

            this.settings.columns.splice(col, 1);
        }

        this.updateUmbracoModel();
    };

    // update column names/types
    updateColumns = changes => {
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
                for (j = 0; j < this.data.length; j += 1) {
                    d = this.data[j];

                    // has a renamed column, needs updating
                    if (d.hasOwnProperty(c.old)) {
                        // add a new property using the old value, then delete the old property
                        // only if the name has changed
                        if (c.newName !== c.old) {
                            d[c.newName] = d[c.old];
                            delete d[c.old];
                        }
                        // update the type, only if it has changed
                        if (d.type !== c.newType) {
                            d.type = c.newType;
                        }
                    }
                }
            }
        }
    };


    /**
     * Get the generic base object for the add/edit overlay
     * Data and handlers are set later
     * @param {any} title
     * @param {any} type
     */
    getOverlayBase = (title, type) => {
        return {
            view: this.dialogPath,
            title,
            type,
            size: this.viewSize,
            config: this.settings,
            rteConfig: this.rteConfig,
        }
    }

    /**
     * Open the overlay to add a new row
     */
    addRow = () => {
        const addOverlay = { ...this.getOverlayBase('Add row', 'add'),
            data: this.emptyModel(),
            submit: result => {
                this.setRteFields(result);

                // geocode the model and add it to the model
                let newItem = this.mapsLoaded ? this.tabulateResource.geocode(result) : result;
                this.tabulateResource.setLabels(newItem, true, this.settings.label);

                this.data.push(newItem);

                this.afterAddEditRow();
            },
            close: () => this.editorService.close()            
        };

        this.editorService.open(addOverlay);
    };

    /**
     * Open the overlay to edit an existing row
     * @param {any} guid
     */
    editRow = guid => {
        const idx = this.data.findIndex(d => d._guid === guid);
        const originalValue = { ...this.data[idx] };

        const editOverlay = { ...this.getOverlayBase('Edit row', 'edit'),
            data: this.data[idx],
            submit: model => {
                // model is a reference to this.data[idx]
                this.setRteFields(model);

                // if the model has a new address, geocode it
                // then store the model in the model
                this.tabulateResource.setLabels(model, true, this.settings.label);
                model.recode && this.mapsLoaded ? this.tabulateResource.geocode(model) : {};      

                // send new, old and mappings
                this.tabulateResource.updateMappedEditor(model, originalValue, this.settings.mappings, this.$scope.model.alias, this.getCurrentVariant());         

                this.afterAddEditRow();
            },
            close: () => this.editorService.close()
        };

        this.editorService.open(editOverlay);
    };

    afterAddEditRow = () => {
        this.editorService.close();

        this.updateUmbracoModel();
        this.setSorting();
        this.setPaging();
    }

    getCurrentVariant = () => 
        this.editorState.current.variants.find(v => v.active);
    

    /**
     * Remove an existing row from the collection
     * @param {any} guid
     */
    removeRow = guid => {
        const idx = this.data.findIndex(d => d._guid === guid);

        if (this.data.length) {
            this.overlayService.confirm({
                confirmMessage: 'Are you sure you want to remove this item?',
                hideHeader: true,
                submit: () => {
                    this.data.splice(idx, 1);

                    this.updateUmbracoModel();
                    this.setPaging();

                    this.overlayService.close();
                },
                close: () => this.overlayService.close()
            });

        }
    };

    /**
     * Set the disabled state for the selected row
     * @param {any} guid
     */
    disableRow = guid => {
        const row = this.data.find(d => d._guid === guid);
        const previousValue = { ...row };

        row.disabled = !!row.disabled ? false : true;

        this.tabulateResource.updateMappedEditor(row, previousValue, this.settings.mappings, this.$scope.model.alias, this.getCurrentVariant());
        this.updateUmbracoModel();
    };

    /**
     * 
     * 
     * @param {any} model
     */
    setRteFields = model => {
        // get the value from rte fields, if any exist
        if (!model.rteConfig)
            return;

        const rteKeys = Object.keys(model.rteConfig);

        if (rteKeys.length) {
            for (let key of rteKeys) {
                model.data[key] = model.rteConfig[key].value;
            }
        }
    };

    /**
     * Open  the settings overlay
     */
    openSettings = () => {

        this.search = '';

        const settingsOverlay = {
            view: `${this.basePath}/overlays/settings.html`,
            title: 'Settings',
            size: 'medium',
            alias: this.$scope.model.alias,
            data: this.data,
            config: this.settings,
            submit: model => {
                this.editorService.close();

                this.data = model.data;

                this.setSorting();
                this.setPaging();

                // if the columnsToRemove array exists, remove each config row
                if (model.columnsToRemove.length > 0) {
                    for (let col of model.columnsToRemove) {
                        removeColumn(col);
                    }
                }

                // changes object will exist if changes were made to column names or types
                const hasColumnChanges = model.changes.some(x => x.hasOwnProperty('newName') || x.hasOwnProperty('newType'));
                if (hasColumnChanges) {
                    this.updateColumns(model.changes);
                }

                // if the config has been altered
                if (hasColumnChanges || model.newColumnName || model.configChanged) {
                    this.notificationsService.success('Settings updated', 'Don\'t forget to save your changes');
                }

                // better force the labels to be reset - not always apparent from checking config changes
                this.tabulateResource.setLabels(this.data, true, this.settings.label);

                // finally, if there's nothing left in the config, set the noConfig state
                this.noConfig = this.settings === undefined ? true : false;

                // need to do this explicitly as it may be imported content
                this.updateUmbracoModel();
            },
            close: () => this.editorService.close()
        };

        this.editorService.open(settingsOverlay);
    };


    /**
     * 
     * @param {any} pageNumber
     */
    goToPage = pageNumber => {
        this.pagination.pageIndex = pageNumber - 1;
        this.pagination.pageNumber = pageNumber;

        this.setPaging();
    };

    /**
     * get the page from the paging service
     */
    setPaging = () => {
        this.pagination = this.tabulatePagingService.updatePaging(this.data,
            this.pagination.search,
            this.pagination.pageNumber,
            this.settings.numPerPage);
        this.noResults = this.pagination.items.length === 0 && this.data.length ? true : false;
    };

    /** */
    setDataGuids = () => {
        if (this.data[0]._guid)
            return;

        this.data.forEach(d => {
            d._guid = uuidv4(); 
        });

        this.notificationsService.info('Tabulate data updated - please save and reload');
    }

    /////////////////////////////////
    // kick the whole thing off... //
    /////////////////////////////////
    init = () => {
        if (this.$scope.model.value === undefined || this.$scope.model.value.length === 0) {
            this.$scope.model.value = {
                settings: {
                    columns: [],
                    label: '',
                    islistView: false,
                    numPerPage: 10
                },
                data: []
            };
            this.data = this.$scope.model.value.data;
            this.settings = this.$scope.model.value.settings;
        }
        else if (this.$scope.model.value.settings) {
            this.data = this.$scope.model.value.data;
            this.settings = this.$scope.model.value.settings;

            if (this.data) {
                this.setDataGuids();
                this.setSorting();
                this.setPaging();
            }
        }

        this.noConfig = this.settings.columns.length === 0;
        this.loading = false;
    };
}