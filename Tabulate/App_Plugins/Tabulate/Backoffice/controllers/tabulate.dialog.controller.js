/*global angular, google, confirm*/
(function () {
    'use strict';
    function tabulateDialogController($scope) {

        // view loops through the properties array to build the rte - o will have a value added if the data model contains rte fields
        $scope.model.rte = {};

        this.getRte = n => ({

            label: 'bodyText',
            description: '',
            view: 'rte',
            config: {
                editor: $scope.model.rteConfig,
                hideLabel: true
            },
            hideLabel: true,
            value: $scope.model.data[n],
            modelLabel: n

        });

        this.inputType = type => {
            return type === 'string' ? 'text' : type;
        };

        /**
         * Close and clear the overlay
         */
        const closeOverlay = () => {
            this.overlay.show = false;
            this.overlay = null;
        };

        // specific to edit //
        if ($scope.model.type === 'edit') {

            if ($scope.model.data.hasOwnProperty('_Address') && $scope.model.data._Address !== undefined &&
                $scope.model.data.hasOwnProperty('lat') && $scope.model.data.lat !== undefined &&
                $scope.model.data.hasOwnProperty('lng') && $scope.model.data.lng !== undefined) {

                this.hasGeocodedAddress = true;
            }

            this.viewLocation = () => {

                this.overlay = {
                    view: '../App_Plugins/Tabulate/backoffice/views/mapDialog.html',
                    show: true,
                    lat: $scope.model.data.lat,
                    lng: $scope.model.data.lng,
                    title: 'Update address coordinates',
                    submit: resp => {
                        closeOverlay();

                        const keys = Object.keys($scope.model.data._Address);

                        if (keys.length === 2) {
                            $scope.model.data._Address[keys[0]] = resp.lat;
                            $scope.model.data._Address[keys[1]] = resp.lng;

                            $scope.model.data.lat = resp.lat;
                            $scope.model.data.lng = resp.lng;
                        }
                    },
                    close: () => {
                        closeOverlay();
                    }
                };
            };

            // if the passed data includes an address, and the value changes
            // set a flag to recode the address
            $scope.$watch('model.data.Address', (newVal, oldVal) => {
                if (newVal !== oldVal) {
                    $scope.model.recode = true;
                }
            });

            $scope.$watch('overlayForm.$invalid',
                newVal => {
                    if (newVal) {
                        $scope.model.hideSubmitButton = true;
                    }
                });

        }
    }

    angular.module('umbraco').controller('Tabulate.DialogController', ['$scope', tabulateDialogController]);

})();