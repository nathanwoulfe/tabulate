export class TabulateDialogController {

    static name = "Tabulate.Dialog.Controller";

    constructor($scope, editorService) {
        this.$scope = $scope;
        this.editorService = editorService;

        this.inputType = type => type === 'string' ? 'text' : type;

        // view loops through the properties array to build the rte - o will have a value added if the data model contains rte fields
        this.$scope.model.rteConfig = {};

        const rtes = this.$scope.model.config.columns.filter(x => x.type === 'rte');
        if (rtes) {
            for (let rte of rtes) {
                this.$scope.model.rteConfig[rte.displayName] = this.getRteConfig(rte.displayName);
            }
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