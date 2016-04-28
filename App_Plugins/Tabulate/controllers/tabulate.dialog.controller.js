/*global angular, google, confirm*/
(function () {
    'use strict';
    function tabulateDialogController($scope, dialogService) {
        // variables
        var address, // string to store the geocoded address
            keys, // keys for the lat/lng values for the geocoded address
            recode = false,
            remap = ''; // flag to indicate if the address string has changed and requires recoding

        // view loops through the properties array to build the rte - o will have a value added if the data model contains rte fields
        $scope.rte = {};
        $scope.property = function (n) {
            return {
                label: 'bodyText',
                description: '',
                view: 'rte',
                config: {
                    editor: {
                        toolbar: ["styleselect", "code", "bold", "italic", "bullist", "numlist", "link", "umbmediapicker"],
                        stylesheets: ["TinyMCE"],
                        dimensions: { height: 300, width: '100%' }
                    },
                    hideLabel: true
                },
                hideLabel: true,
                value: $scope.dialogData.data[n],
                dialogDataLabel: n
            };
        };

        // specific to edit //
        if ($scope.dialogData.type === 'edit') {

            // if the passed data inlcudes a geocoded address (key is _Address)
            // parse the lat lng values for display
            if ($scope.dialogData.data.hasOwnProperty('_Address') && $scope.dialogData.data.Address !== undefined
                    && $scope.dialogData.data.hasOwnProperty('lat') && $scope.dialogData.data.lat !== undefined
                    && $scope.dialogData.data.hasOwnProperty('lng') && $scope.dialogData.data.lng !== undefined) {
                //address = $scope.dialogData.data._Address;

                // the keys are google-assigned and may change, so don't want to hard-code the references
                //Couldn't save the goodle-assigned object as json string therfore just used the lat and lang values 
                $scope._AddressLat = $scope.dialogData.data.lat;
                $scope._AddressLng = $scope.dialogData.data.lng;
            }

            $scope.viewLocation = function ($index) {
                dialogService.open({
                    template: '../App_Plugins/Tabulate/views/mapDialog.html',
                    show: true,
                    dialogData: { lat: $scope._AddressLat, lng: $scope._AddressLng },
                    callback: function (resp) {

                        var keys = Object.keys($scope.dialogData.data._Address);
                        if (keys.length === 2) {
                            $scope.dialogData.data._Address[keys[0]] = resp.lat();
                            $scope.dialogData.data._Address[keys[1]] = resp.lng();
                            $scope._AddressLat = resp.lat();
                            $scope._AddressLng = resp.lng();
                        }
                    }
                });
            };

            // need to return the original name - oldval will be an incremental change, ie the previous char
            var originalProgramName = $scope.dialogData.data['External program name'],
                originalInstitutionName = $scope.dialogData.data['Institution name'];

            // if the passed data includes an updated external program name
            // set a flag to update the mapping section in credit calc page
            $scope.$watch('dialogData.data["External program name"]', function (newVal, oldVal) {
                if (newVal !== oldVal) {
                    remap = originalProgramName;
                }
            });
            // if the passed data includes an updated institution name
            // set a flag to update the mapping section in credit calc page
            $scope.$watch('dialogData.data["Institution name"]', function (newVal, oldVal) {
                if (newVal !== oldVal) {
                    remap = originalInstitutionName;
                }
            });
            // if the passed data includes an address, and the value changes
            // set a flag to recode the address
            $scope.$watch('dialogData.data.Address', function (newVal, oldVal) {
                if (newVal !== oldVal) {
                    recode = true;
                }
            });
        }

        // save and close, sending back updated data model
        $scope.save = function () {

            // this needs to be pushed back into the dialogData.data object before submitting
            var rteKeys = Object.keys($scope.rte), i;

            if (rteKeys.length) {
                for (i = 0; i < rteKeys.length; i += 1) {
                    $scope.dialogData.data[rteKeys[i]] = $scope.rte[rteKeys[i]].value;
                }
            }
            // no need to return the config object, it has not changed
            $scope.submit({ data: $scope.dialogData.data, recode: recode, remap: remap });
        };

    }

    angular.module('umbraco').controller('Tabulate.DialogController', ['$scope', 'dialogService', tabulateDialogController]);

})();