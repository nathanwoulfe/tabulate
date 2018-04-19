/*global angular, google, confirm*/
(function () {
    'use strict';

    function tabulateMapDialogController($scope, angularHelper) {

        const mapOptions = {
            zoom: 8,
            center: new google.maps.LatLng($scope.dialogData.lat, $scope.dialogData.lng),
            mapTypeId: google.maps.MapTypeId.TERRAIN
        };

        $scope.map = new google.maps.Map(document.getElementById('map'), mapOptions);
        $scope.locationChanged = false;

        const marker = new google.maps.Marker({
            map: $scope.map,
            position: new google.maps.LatLng($scope.dialogData.lat, $scope.dialogData.lng),
            draggable: true
        });

        google.maps.event.addListener(marker, 'dragend', function (event) {
            dragend(event);
        });

        var dragend = function(e) {
            if ($scope.dialogData.lat !== e.latLng.lat() || $scope.dialogData.lng !== e.latLng.lng()) {
                $scope.dialogData.lat = e.latLng.lat();
                $scope.dialogData.lng = e.latLng.lng();
                $scope.locationChanged = true;
                angularHelper.safeApply($scope);
            }
        };

        // save and close, sending back updated data model
        $scope.save = function () {
            $scope.submit($scope.dialogData);
        };

    }

    angular.module('umbraco').controller('Tabulate.MapDialogController', ['$scope', 'angularHelper', tabulateMapDialogController]);

})();