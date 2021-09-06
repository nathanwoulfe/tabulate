export class TabulateDialogController {

    static name = "Tabulate.Dialog.Controller";

    constructor($scope, editorService, editorState, tabulateResource, assetsService, $timeout) {
        this.$scope = $scope;
        this.editorService = editorService;
        this.editorState = editorState;
        this.tabulateResource = tabulateResource;

        this.inputType = type => type === 'string' ? 'text' : type;

        // view loops through the properties array to build the rte - o will have a value added if the data model contains rte fields
        this.$scope.model.rteConfig = {};

        const rteKeys = this.$scope.model.config.columns
            .filter(x => x.type === 'rte')
            .map(x => x.displayName);

        rteKeys.forEach(displayName => this.$scope.model.rteConfig[displayName] = this.getRteConfig(displayName));

        // check for, and link, linked columns
        const linkedColumns = this.$scope.model.config.columns
            .filter(x => x.type === 'linked');

        if (linkedColumns.length) {
            assetsService.loadJs('lib/typeahead.js/typeahead.bundle.min.js')
                .then(() => $timeout(() => linkedColumns.forEach(l => this.bindLinkedColumn(l))));
        }

        // specific to edit //
        if (this.$scope.model.type === 'edit') {

            this.hasGeocodedAddress = this.$scope.model.data._Address &&
                this.$scope.model.data._Address.lat !== undefined &&
                this.$scope.model.data._Address.lng !== undefined;

            // if the passed data includes an address, and the value changes
            // set a flag to recode the address
            this.addressWatch = this.$scope.$watch('model.data.Address', (newVal, oldVal) => {
                if (newVal !== oldVal) {
                    this.$scope.model.recode = true;
                }
            });
        }
    }

    $onDestroy = () => {
        this.addressWatch ? this.addressWatch() : {};
    }

    /**
     * For a linked column type, lookup the corresponding data from the current page
     * and determine if it's a simple repeated string, a tabulate instance, or an iterable string
     * @param {any} column
     */
    bindLinkedColumn = column => {
        const tabulateEditors = this.tabulateResource.getTabulateEditors(
            this.$scope.model.alias,
            this.editorState.current.variants.find(v => v.active));

        const linkedEditor = tabulateEditors.find(t => t.alias == column.source);
        const linkedTabulateEditor = linkedEditor.editor === 'NW.Tabulate';

        // get the data from the linked editor, depending on alias
        const data = linkedTabulateEditor ? linkedEditor.value.data : linkedEditor.value;

        // configure typeahead using linked data
        const options = {
            highlight: true,
            minLength: 1
        };

        const sources = {
            name: 'sources',
            source: new Bloodhound({
                datumTokenizer: linkedTabulateEditor ? Bloodhound.tokenizers.obj.whitespace('_label') : Bloodhound.tokenizers.whitespace,
                queryTokenizer: Bloodhound.tokenizers.whitespace,
                local: data
            }),
        }

        if (linkedTabulateEditor) {
            sources.displayKey = '_label';
        }

        const typeaheadElement = angular.element('#typeahead_' + this.safeName(column.displayName));
        typeaheadElement.typeahead(options, sources)
            .bind("typeahead:selected", (obj, datum, name) => {
                this.$scope.model.data[column.displayName] = datum._label;
                this.$scope.model.data[column.displayName + '_link'] = datum._guid;
            }).bind("typeahead:autocompleted", (obj, datum, name) => {
                this.$scope.model.data[column.displayName] = datum._label;
                this.$scope.model.data[column.displayName + '_link'] = datum._guid;
            });
    }

    /**
     * Replace spaces with underscores
     * @param {any} str
     */
    safeName = str => str.replace(/ /gi, '_');

    viewLocation = () => {

        const mapOverlay = {
            view: Umbraco.Sys.ServerVariables.Tabulate.pluginPath + '/overlays/mapDialog.html',
            lat: this.$scope.model.data.lat,
            lng: this.$scope.model.data.lng,
            title: 'Update address coordinates',
            submit: resp => {
                this.editorService.close();

                const keys = Object.keys(this.$scope.model.data._Address);

                if (keys.length === 2) {
                    this.$scope.model.data._Address[keys[0]] = resp.lat;
                    this.$scope.model.data._Address[keys[1]] = resp.lng;

                    this.$scope.model.data.lat = resp.lat;
                    this.$scope.model.data.lng = resp.lng;
                }
            },
            close: () => this.editorService.close()
        };

        this.editorService.open(mapOverlay);
    };

    getRteConfig = n => (
        {
            alias: n.toLowerCase(),
            config: {
                editor: this.$scope.model.rteConfig,
                hideLabel: true
            },
            culture: null,
            description: '',
            editor: 'Umbraco.TinyMCE',
            hideLabel: true,
            id: n.length,
            isSensitive: false,
            label: n,
            readonly: false,
            validation: {
                mandatory: false,
                pattern: null
            },
            value: this.$scope.model.data[n],
            view: 'views/propertyeditors/rte/rte.html'
        }
    );
}