/*global angular, google, confirm*/
(function () {
    'use strict';
    function tabulateDialogController($scope, dialogService) {

        // view loops through the properties array to build the rte - o will have a value added if the data model contains rte fields
        $scope.model.rte = {};

        $scope.property = function (n) {
            return {
                label: 'bodyText',
                description: '',
                view: 'rte',
                config: {
                    editor: {
                        toolbar: ['styleselect', 'code', 'bold', 'italic', 'bullist', 'numlist', 'link', 'umbmediapicker'],
                        stylesheets: ['TinyMCE'],
                        dimensions: { height: 300, width: '100%' }
                    },
                    hideLabel: true
                },
                hideLabel: true,
                value: $scope.model.data[n],
                modelLabel: n
            };
        };

        // specific to edit //
        if ($scope.model.type === 'edit') {

            // if the passed data inlcudes a geocoded address (key is _Address)
            // parse the lat lng values for display
            if ($scope.model.data.hasOwnProperty('_Address') && $scope.model.data.Address !== undefined
                    && $scope.model.data.hasOwnProperty('lat') && $scope.model.data.lat !== undefined
                    && $scope.model.data.hasOwnProperty('lng') && $scope.model.data.lng !== undefined) {

                // the keys are google-assigned and may change, so don't want to hard-code the references
                //Couldn't save the goodle-assigned object as json string therfore just used the lat and lang values 
                $scope._AddressLat = $scope.model.data.lat;
                $scope._AddressLng = $scope.model.data.lng;
            }

            $scope.viewLocation = function () {
                dialogService.open({
                    template: '../App_Plugins/Tabulate/backoffice/views/mapDialog.html',
                    show: true,
                    model: { lat: $scope._AddressLat, lng: $scope._AddressLng },
                    callback: function (resp) {

                        const keys = Object.keys($scope.model.data._Address);
                        if (keys.length === 2) {
                            $scope.model.data._Address[keys[0]] = resp.lat();
                            $scope.model.data._Address[keys[1]] = resp.lng();
                            $scope._AddressLat = resp.lat();
                            $scope._AddressLng = resp.lng();
                        }
                    }
                });
            };

            // if the passed data includes an address, and the value changes
            // set a flag to recode the address
            $scope.$watch('model.data.Address', function (newVal, oldVal) {
                if (newVal !== oldVal) {
                    $scope.model.recode = true;
                }
            });
        }
    }

    angular.module('umbraco').controller('Tabulate.DialogController', ['$scope', 'dialogService', tabulateDialogController]);

})();