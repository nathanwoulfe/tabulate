(() => {

    function tabulateDialogController($scope, editorService) {

        this.inputType = type => type === 'string' ? 'text' : type;

        // view loops through the properties array to build the rte - o will have a value added if the data model contains rte fields
        $scope.model.rteConfig = {};

        const getRteConfig = n => {
            return {
                alias: n.toLowerCase(),
                config: {
                    editor: $scope.model.rteConfig,
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
                value: $scope.model.data[n],
                view: 'views/propertyeditors/rte/rte.html'
            };
        };

        const rtes = $scope.model.config.columns.filter(x => x.type === 'rte');
        if (rtes) {
            for (let rte of rtes) {
                $scope.model.rteConfig[rte.displayName] = getRteConfig(rte.displayName);
            }
        }

        console.log($scope.model.rteConfig);

        // specific to edit //
        if ($scope.model.type === 'edit') {

            this.hasGeocodedAddress = $scope.model.data._Address &&
                $scope.model.data._Address.lat !== undefined &&
                $scope.model.data._Address.lng !== undefined;

            // if the passed data includes an address, and the value changes
            // set a flag to recode the address
            $scope.$watch('model.data.Address', (newVal, oldVal) => {
                if (newVal !== oldVal) {
                    $scope.model.recode = true;
                }
            });
        }

        this.viewLocation = () => {

            const mapOverlay = {
                view: '../App_Plugins/Tabulate/backoffice/views/mapDialog.html',
                lat: $scope.model.data.lat,
                lng: $scope.model.data.lng,
                title: 'Update address coordinates',
                submit: resp => {
                    editorService.close();

                    const keys = Object.keys($scope.model.data._Address);

                    if (keys.length === 2) {
                        $scope.model.data._Address[keys[0]] = resp.lat;
                        $scope.model.data._Address[keys[1]] = resp.lng;

                        $scope.model.data.lat = resp.lat;
                        $scope.model.data.lng = resp.lng;
                    }
                },
                close: () => {
                    editorService.close();
                }
            };

            editorService.open(mapOverlay);
        };
    }

    angular.module('tabulate').controller('Tabulate.DialogController', ['$scope', 'editorService', tabulateDialogController]);

})();